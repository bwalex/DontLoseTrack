require 'digest/md5'
require 'bcrypt'
require './db_helpers.rb'

$template_cache = nil
@config = YAML::load(File.open('config/config.yml'))
if not @config['cache'].nil? and @config['cache']['store'] == 'memcache'
  $template_cache = {
    :key_prefix => @config['cache']['key_prefix'],
    :dc         => Dalli::Client.new(@config['cache']['location'])
  }
end


class User < ActiveRecord::Base
  attr_accessor :new_password, :new_password_confirmation
  attr_accessor :remove_password

  strip :name, :alias

  has_many :user_project_settings

  has_many :project_users

  has_many :projects,     :through => :project_users,
                          :uniq => true


  validates :name, :length => { :in => 2..40 }, :unless => :is_new_openid?
  validates_confirmation_of :new_password, :if=>:password_changed?
  validates :email, :presence => true, :uniqueness => true, :email => true, :unless => :is_new_openid?
  #validates :remove_password, :presence => false, :unless => :is_openid_user?
  validates_uniqueness_of :alias, :unless => :is_new_openid?
  validates_uniqueness_of :openid, :allow_nil => true, :allow_blank => true

  before_save :hash_new_password, :if => :password_changed?
  before_save :remove_password, :if => :password_removed?
  before_save :hash_mail, :unless => :is_new_openid?

  def to_s
    self[:name]
  end

  def is_new_openid=(val)
    @new_openid = val
  end

  def is_new_openid?
    return ((defined? @new_openid and @new_openid) or self[:alias].nil? or self[:alias].empty?)
  end

  def openid_only
    return self[:password].blank?
  end

  def email=(mail)
    self[:email] = mail.strip.downcase
  end

  def is_openid_user
    !self[:openid].blank?
  end

  def is_openid_user?
    is_openid_user
  end

  def password_changed?
    !@new_password.blank?
  end

  def password_removed?
    (@remove_password == true)
  end

  def as_json(options={})
    only = [
            :id,
            :alias,
            :email,
            :email_hashed,
            :name
           ]

    methods = []

    if defined? options[:user] and not options[:user].nil? and options[:user].id == self[:id]
      methods << :openid_only << :is_openid_user
    end

    super(
      :only => only,
      :methods => methods
    )
  end


  def self.auth_by_openid(openid)
    return find_by_openid(openid)
  end


  def self.authenticate(email, password)
    # Because we use bcrypt we can't do this query in one part, first
    # we need to fetch the potential user
    if user = find_by_email(email)
      # Then compare the provided password against the hashed one in the db.
      if BCrypt::Password.new(user.password).is_password? password
        # If they match we return the user 
        return user
      end
    end
    # If we get here it means either there's no user with that email, or the wrong
    # password was provided.  But we don't want to let an attacker know which. 
    return nil
  end


  private

  def hash_mail
    self[:email_hashed] = Digest::MD5.hexdigest(self[:email].strip.downcase)
  end

  def hash_new_password
    self[:password] = BCrypt::Password.create(@new_password)
  end

  def remove_password
    self[:password] = nil
  end
end


class ProjectUser < ActiveRecord::Base
  belongs_to :user
  belongs_to :project

  validates_uniqueness_of  :user_id, :scope => :project_id,
                                     :message => "already on that project"
  validates_presence_of :project
  validates_associated  :project
  validates_presence_of :user
  validates_associated  :user

  before_destroy :save_names
  after_create :set_default_settings

  def set_default_settings
    default_settings = {
      'timeline:events' => 'notes,tasks,wikis',
      'tasks:default_sort' => 'intelligent'
    }

    default_settings.each do |k, v|
      ds = UserProjectSetting.create!(
        :project => project,
        :user => user,
        :key => k,
        :value => v
      )
    end
  end


  def save_names
    project.events.where(:user_id => self[:user_id]).each do |ev|
      ev.fallback_username = user.name
      ev.save!
    end

    project.notes.where(:user_id => self[:user_id]).each do |n|
      n.fallback_username = user.name
      n.save!
    end

    WikiContent.includes(:wiki)
      .where(:user_id => self[:user_id])
      .where(:wikis => { :project_id => self[:project_id] })
      .each do |wc|
        wc.fallback_username = user.name
        wc.save!
      end
  end
end


class UserProjectSetting < ActiveRecord::Base
  strip :key, :value

  belongs_to :project
  belongs_to :user,     :inverse_of => :user_project_settings

  validates :key, :length => { :in => 1..200 }
  validates_uniqueness_of :key,  :scope => [:user_id, :project_id]
  validates_presence_of :project
  validates_associated  :project
  validates_presence_of :user
  validates_associated  :user
end



class Setting < ActiveRecord::Base
  strip :key, :value

  belongs_to :project,  :inverse_of => :settings

  validates :key, :length => { :in => 1..200 }
  validates_uniqueness_of :key,  :scope => :project_id
  validates_presence_of :project
  validates_associated  :project
end


class ExtResource < ActiveRecord::Base
  strip :type, :location

  self.inheritance_column = :inheritance_type

  belongs_to :project,  :inverse_of => :settings

  validates :type, :length => { :in => 1..200 }
  validates :location, :length => { :minimum => 1 }
  validates_presence_of :project
  validates_associated  :project
end



class Event < ActiveRecord::Base
  strip :type

  self.inheritance_column = :inheritance_type

  belongs_to :ext_resource #, :optional
  belongs_to :user #, :optional
  belongs_to :project,  :inverse_of => :settings

  validates :type, :length => { :in => 1..200 }
  validates_presence_of :project
  validates_associated  :project

  def body
    if not $template_cache.nil?
      h = $template_cache[:dc].get(
        "#{$template_cache[:key_prefix]}:events:#{self[:id].to_s}"
      )
      return h unless h.nil?
    end

    pdata = JSON.parse(data)
    erb = ERB.new(File.read('templates/events/' + type.gsub(":", "_") + '.rhtml'))
    h = erb.result(binding)

    if not $template_cache.nil?
      $template_cache[:dc].set(
        "#{$template_cache[:key_prefix]}:events:#{self[:id].to_s}",
        h
      )
    end

    return h
  end


  def raw_occurred_at
    return (self[:occurred_at] != nil)? self[:occurred_at].to_time.to_i : nil
  end


  def occurred_at
    return (self[:occurred_at] != nil) ? self[:occurred_at].strftime("%d/%m/%Y - %H:%M") : nil
  end

  def as_json(options={})
    super(
       :methods => [ :raw_occurred_at, :body ]
#      :include => { :user => { :only => [:email_hashed, :name] } }
    )
  end
end


class Mail < ActiveRecord::Base
  belongs_to :project,  :inverse_of => :settings
  strip :from, :to, :cc, :subject

  has_many :mail_tags
  has_many :tags,       :through => :mail_tags,
                        :uniq => true


  validates_presence_of :project
  validates_associated  :project

end


class Document < ActiveRecord::Base
  self.inheritance_column = :inheritance_type

  strip :name, :mimetype, :path

  belongs_to :project,  :inverse_of => :settings

  has_many :document_tags
  has_many :tags,       :through => :document_tags,
                        :uniq => true


  validates_presence_of :project
  validates_associated  :project
end



class Project < ActiveRecord::Base
  attr_accessor :new_owner
  attr_accessor :current_user

  strip :name

  belongs_to :owner,      :class_name => "User",
                          :foreign_key => "owner_id"#,
                          #:include => :alias

  has_many :tags,         :dependent => :delete_all

  has_many :notes,        :dependent => :delete_all
  has_many :tasks,        :dependent => :delete_all
  has_many :mails,        :dependent => :delete_all
  has_many :wikis,        :dependent => :delete_all
  has_many :documents,    :dependent => :delete_all

  has_many :settings,     :dependent => :delete_all
  has_many :ext_resources, :dependent => :delete_all
  has_many :events,       :dependent => :delete_all

  has_many :project_users
  has_many :users,        :through => :project_users,
                          :uniq => true

  before_save :set_new_owner, :if => :new_owner?

  validates :name, :length => { :in => 1..50 }
  validates_uniqueness_of :name, :scope => :owner_id, :case_sensitive => false

  def new_owner?
    !@new_owner.blank?
  end

  def set_new_owner
    self[:owner_id] = users.find(new_owner).id
  end

  def path
    return "" + owner.alias + "/" + name
  end

  def user_stats
    return {
      'total' => project_users.count
    }
  end

  def task_stats
    # total, tasks completed, pending, overdue
    return {
      'total' => tasks.count,
      'completed' => tasks.count(:conditions => "completed = true"),
      'pending' => tasks.count(:conditions => "completed != true"),
      'overdue' => tasks.count(:conditions => "completed != true AND due_date < NOW()")
    }
  end

  def note_stats
    # total
    return {
      'total' => notes.count
    }
  end

  def wiki_stats
    # total
    return {
      'total' => wikis.count
    }
  end

  def event_stats
    # total
    filters = ["extres:bzr", "extres:github:events:commit", "extres:github:events:pullrequest"]

    if defined? @current_user and not @current_user.nil?
      s = @current_user.user_project_settings.where(:project_id => self[:id], :key => 'timeline:events')
      filters = filters | s[0].value.split(',') unless s.empty?
    end

    return {
      'total' => events.where(:type => filters).count
    }
  end

  def as_json(options={})
    @current_user = options[:user] if defined? options[:user]
    super(
      :include => { :project_users => {}, :owner => { :only => [:id, :alias] } },
      :methods => [ :path, :task_stats, :note_stats, :wiki_stats, :user_stats, :event_stats ]
    )
  end
end


class Note < ActiveRecord::Base
  belongs_to :project,  :inverse_of => :notes

  belongs_to :user

  has_many :note_tags
  has_many :tags,       :through => :note_tags,
                        :uniq => true

  validates :text, :length => { :minimum => 1 }
  validates_presence_of :project
  validates_associated  :project


  def raw_updated_at
    return (self[:updated_at] != nil)? self[:updated_at].to_time.to_i : nil
  end

  def raw_created_at
    return (self[:created_at] != nil)? self[:created_at].to_time.to_i : nil
  end


  def html_text
    if text == nil
      return ''
    else
      return $markdown.render(text)
    end
  end

  def created_at
    return (self[:created_at] != nil) ? self[:created_at].strftime("%d/%m/%Y - %H:%M") : nil
  end

  def updated_at
    return (self[:updated_at] != nil) ? self[:updated_at].strftime("%d/%m/%Y - %H:%M") : nil
  end


  def as_json(options={})
    super(
      :methods => [ :html_text, :raw_created_at, :raw_updated_at ],
      :include =>  { :note_tags => {} }#, :user => { :only => [:email_hashed, :name] } }

      #:include => [ :tags, :note_tags ]
      #:include => { :tags => {}, :note_tags => { :include => [:note, :tag] } }
    )
  end
end


class WikiContent < ActiveRecord::Base
  strip :comment

  belongs_to :wiki,     :inverse_of => :wiki_contents

  belongs_to :user

  validates_presence_of :wiki
  validates_associated  :wiki
  validates :comment, :length => { :minimum => 1 }


  def html_text
    if text == nil
      return ''
    else
      return $markdown.render(text)
    end
  end

  def created_at
    return (self[:created_at] != nil) ? self[:created_at].strftime("%d/%m/%Y - %H:%M") : nil
  end

  def updated_at
    return (self[:updated_at] != nil) ? self[:updated_at].strftime("%d/%m/%Y - %H:%M") : nil
  end

  def raw_updated_at
    return (self[:updated_at] != nil)? self[:updated_at].to_time.to_i : nil
  end

  def raw_created_at
    return (self[:created_at] != nil)? self[:created_at].to_time.to_i : nil
  end


  def as_json(options={})
    super(
      #:include => { :user => { :only => [:email_hashed, :name] } },
      :methods => [ :html_text, :raw_updated_at, :raw_created_at ]
    )
  end
end


class Wiki < ActiveRecord::Base
  strip :title

  belongs_to :project,  :inverse_of => :wikis

  has_many :wiki_tags
  has_many :tags,       :through => :wiki_tags,
                        :uniq => true

  has_many :wiki_contents

  validates :title, :length => { :in => 1..200 }
  validates_uniqueness_of :title,  :scope => :project_id,
                                   :case_sensitive => false

  validates_presence_of :project
  validates_associated  :project


  def raw_text
    text = ''

    newestContent = wiki_contents.order('created_at DESC').first
    if newestContent != nil
      text = newestContent.text
    end

    return text
  end


  def nwcs
    return wiki_contents.count
  end


  def html_text
    return $markdown.render(raw_text)
  end


  def last_updated_at
    return updated_at = self[:updated_at].strftime("%d/%m/%Y - %H:%M")
  end


  def as_json(options={})
    super(
      :methods => [ :html_text, :last_updated_at, :raw_text, :nwcs ],
      :include => { :wiki_tags => {} } #, :wiki_contents => { :only => [:wiki, :id, :user_id] } }
    )
  end
end


class NoteTag < ActiveRecord::Base
#  self.primary_keys = :note_id, :tag_id

  belongs_to :note
  belongs_to :tag

  validates_uniqueness_of  :tag_id, :scope => :note_id,
                                    :message => "already applied to that Note"

#  def as_json(options={})
#    super(
#      :include => [ :note, :tag ]
#    )
#  end
end


class TaskTag < ActiveRecord::Base
#  self.primary_keys = :task_id, :tag_id

  belongs_to :task
  belongs_to :tag

  validates_uniqueness_of  :tag_id, :scope => :task_id,
                                    :message => "already applied to that Task"
end


class WikiTag < ActiveRecord::Base
#  self.primary_keys = :wiki_id, :tag_id

  belongs_to :wiki
  belongs_to :tag

  validates_uniqueness_of  :tag_id, :scope => :wiki_id,
                                    :message => "already applied to that Wiki"
end



class MailTag < ActiveRecord::Base
  belongs_to :mail
  belongs_to :tag

  validates_uniqueness_of  :tag_id, :scope => :mail_id,
                                    :message => "already applied to that Mail"
end



class DocumentTag < ActiveRecord::Base
  belongs_to :document
  belongs_to :tag

  validates_uniqueness_of  :tag_id, :scope => :document_id,
                                    :message => "already applied to that Document"
end




class Tag < ActiveRecord::Base
  strip :name, :color

  belongs_to :project,    :inverse_of => :tags
  has_many :note_tags
  has_many :notes,        :through => :note_tags

  has_many :task_tags
  has_many :tasks,        :through => :task_tags

  has_many :wiki_tags
  has_many :wikis,        :through => :wiki_tags

  has_many :document_tags
  has_many :documents,    :through => :document_tags

  has_many :mail_tags
  has_many :mails,        :through => :mail_tags

  validates :name,        :length => { :in => 1..32 }
  validates_uniqueness_of :name,  :scope => :project_id,
                                  :case_sensitive => false
  validates_format_of     :color, :with => /#[abcdefABCDEF0123456789]{6}/,
                                  :message => "Color must be an HTML color like #abcdef",
                                  :allow_nil => true

  def as_json(options={})
    super(
      :include => [ :note_tags, :task_tags, :wiki_tags ]
    )
  end
end


class TaskDep < ActiveRecord::Base
#  self.primary_keys :task_id, :dependency_id

  belongs_to :task
  belongs_to :dependency, :class_name => "Task",
                          :foreign_key => "dependency_id"

  validates_uniqueness_of  :dependency_id, :scope => :task_id,
                                           :message => "already a dependency for this Task"
end


class Task < ActiveRecord::Base
  IMPORTANCE_NONE   = 0
  IMPORTANCE_LOW    = 1
  IMPORTANCE_MEDIUM = 2
  IMPORTANCE_HIGH   = 3

  strip :summary

  belongs_to :project,  :inverse_of => :tasks

  has_many :task_tags
  has_many :tags,       :through => :task_tags,
                        :uniq => true

  has_many :task_deps
  has_many :deps,       :through => :task_deps,
                        :source => :dependency

  has_many :dep_tasks,  :class_name => 'TaskDep', :foreign_key => 'dependency_id'

  validates :summary,   :length => { :in => 1..140 }
  validates_presence_of :project
  validates_associated  :project

  def importance=(imp)
    case imp
    when "high"
      self[:importance] = IMPORTANCE_HIGH
    when "medium"
      self[:importance] = IMPORTANCE_MEDIUM
    when "low"
      self[:importance] = IMPORTANCE_LOW
    else
      self[:importance] = IMPORTANCE_NONE
    end
  end

  def importance
    case self[:importance]
    when IMPORTANCE_NONE
      return "none"
    when IMPORTANCE_LOW
      return "low"
    when IMPORTANCE_MEDIUM
      return "medium"
    when IMPORTANCE_HIGH
      return "high"
    else
      return "none"
    end
  end

  def due_date=(date)
    self[:due_date] = (date != nil && date != '') ? DateTime.strptime(date, "%d/%m/%Y") : nil
  end

  def due_date
    return (self[:due_date] != nil) ? self[:due_date].strftime("%d/%m/%Y") : nil
  end

  def raw_due_date
    return (self[:due_date] != nil)? self[:due_date].to_time.to_i : nil
  end

  def raw_importance
    return self[:importance]
  end

  def due_date_class
    if self[:due_date] == nil
      return ''
    end

    date = self[:due_date].to_date
    classes = ''
    if date < Date.today
      classes << 'duedate-past'
    end

    if date == Date.today
      classes << 'duedate-today'
    end

    if date == Date.today+1
      classes << 'duedate-tomorrow'
    end

    return classes
  end

  def status
    if    completed
      return "completed"
    elsif blocked
      return "blocked"
    elsif deps.count(:conditions => "completed != true") > 0
      return "depends"
    else
      return "active"
    end
  end

  def html_text
    if (text == nil)
      return ''
    else
      return $markdown.render(text)
    end
  end


  def as_json(options={})
    inc = [ ];

    unless options[:completed_no_inc] and self[:completed]
      inc << :task_tags << :task_deps << :dep_tasks
    end

    super(
      :methods => [
                    :html_text,
                    :due_date_class,
                    :raw_due_date,
                    :raw_importance,
                    :status
                  ],
      :include => inc
    )
  end
end
