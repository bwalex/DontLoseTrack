require 'digest/md5'
require 'bcrypt'

class EmailValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    unless value =~ /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i
      record.errors[attribute] << (options[:message] || "is not an email")
    end
  end
end


class User < ActiveRecord::Base
  attr_accessor :new_password, :new_password_confirmation

  has_many :user_project_settings

  has_many :project_users

  has_many :projects,     :through => :project_users,
                          :uniq => true


  validates :name, :length => { :in => 2..40 }
  validates_confirmation_of :new_password, :if=>:password_changed?
  validates :email, :presence => true, :uniqueness => true, :email => true
  validates_uniqueness_of :alias
  validates_uniqueness_of :openid, :allow_nil => true, :allow_blank => true

  before_save :hash_new_password, :if=>:password_changed?
  before_save :hash_mail

  def email=(mail)
    self[:email] = mail.strip.downcase
  end

  def password_changed?
    !@new_password.blank?
  end

  def as_json(options={})
    super(
      :only => [
                :id,
                :email,
                :email_hashed,
                :name
               ]
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

end


class UserProjectSetting < ActiveRecord::Base
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
  belongs_to :project,  :inverse_of => :settings

  validates :key, :length => { :in => 1..200 }
  validates_uniqueness_of :key,  :scope => :project_id
  validates_presence_of :project
  validates_associated  :project
end


class ExtResource < ActiveRecord::Base
  self.inheritance_column = :inheritance_type

  belongs_to :project,  :inverse_of => :settings

  validates :type, :length => { :in => 1..200 }
  validates :location, :length => { :minimum => 1 }
  validates_presence_of :project
  validates_associated  :project
end



class Event < ActiveRecord::Base
  self.inheritance_column = :inheritance_type

  belongs_to :ext_resource #, :optional
  belongs_to :user #, :optional
  belongs_to :project,  :inverse_of => :settings

  validates :type, :length => { :in => 1..200 }
  validates :summary, :length => { :minimum => 1 }
  validates_presence_of :project
  validates_associated  :project

  def occurred_at
    return (self[:occurred_at] != nil) ? self[:occurred_at].strftime("%d/%m/%Y - %H:%M") : nil
  end

  def as_json(options={})
    super(
#      :include => { :user => { :only => [:email_hashed, :name] } }
    )
  end
end


class Mail < ActiveRecord::Base
  belongs_to :project,  :inverse_of => :settings

  has_many :mail_tags
  has_many :tags,       :through => :mail_tags,
                        :uniq => true


  validates_presence_of :project
  validates_associated  :project

end


class Document < ActiveRecord::Base
  self.inheritance_column = :inheritance_type

  belongs_to :project,  :inverse_of => :settings

  has_many :document_tags
  has_many :tags,       :through => :document_tags,
                        :uniq => true


  validates_presence_of :project
  validates_associated  :project
end



class Project < ActiveRecord::Base
  belongs_to :owner,      :class_name => "User",
                          :foreign_key => "owner_id"

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

  validates :name, :length => { :in => 1..50 }
  validates_uniqueness_of :name, :scope => :owner_id

  def task_stats
    # total, tasks completed, pending, overdue
    return {
      'total' => tasks.count,
      'completed' => tasks.count(:conditions => "completed = true"),
      'pending' => tasks.count(:conditions => "completed != true"),
      'overdue' => tasks.count(:conditions => "due_date < NOW()")
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


  def as_json(options={})
    super(
      :methods => [ :task_stats, :note_stats, :wiki_stats ]
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
      :methods => :html_text,
      :include =>  { :note_tags => {} }#, :user => { :only => [:email_hashed, :name] } }

      #:include => [ :tags, :note_tags ]
      #:include => { :tags => {}, :note_tags => { :include => [:note, :tag] } }
    )
  end
end


class WikiContent < ActiveRecord::Base
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

  def as_json(options={})
    super(
      #:include => { :user => { :only => [:email_hashed, :name] } },
      :methods => :html_text
    )
  end
end


class Wiki < ActiveRecord::Base
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


  def html_text
    return $markdown.render(raw_text)
  end


  def last_updated_at
    return updated_at = self[:updated_at].strftime("%d/%m/%Y - %H:%M")
  end


  def as_json(options={})
    super(
      :methods => [ :html_text, :last_updated_at, :raw_text ],
      :include => { :wiki_tags => {}, :wiki_contents => { :only => [:wiki, :id, :user_id] } }
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
    elsif not deps.empty?
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
    super(
      :methods => [
                    :html_text,
                    :due_date_class,
                    :raw_due_date,
                    :raw_importance,
                    :status
                  ],
      :include => [
#                   {:deps => { :methods => [:status], :only => [:id, :summary] }},
#                   :tags,
                    :task_tags,
                    :task_deps,
                    :dep_tasks
                  ]
    )
  end
end

class ActiveRecord::RecordInvalid
  def errors_to_a
    a = []

    record.errors.each do |k, v|
      a.push(k.to_s.split("_").each{|w| w.capitalize!}.join(" ") + " " + v);
    end

    return a
  end

  def errors_to_json
    { "errors" => errors_to_a }.to_json
  end
end

