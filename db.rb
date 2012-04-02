class Project < ActiveRecord::Base
  has_many :tags,     :dependent => :delete_all

  has_many :notes,    :dependent => :delete_all
  has_many :tasks,    :dependent => :delete_all
  has_many :emails,   :dependent => :delete_all
  has_many :wikis,    :dependent => :delete_all
  has_many :files,    :dependent => :delete_all

  validates :name, :length => { :in => 1..50 }
  validates :name, :uniqueness => true
end


class Note < ActiveRecord::Base
  belongs_to :project,  :inverse_of => :notes

  has_many :note_tags
  has_many :tags,       :through => :note_tags,
                        :uniq => true

  validates :text, :length => { :minimum => 1 }

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


  def as_json(options={})
    super(
      :methods => :html_text,
      :include => [ :note_tags ]
      #:include => [ :tags, :note_tags ]
      #:include => { :tags => {}, :note_tags => { :include => [:note, :tag] } }
    )
  end
end


class WikiContent < ActiveRecord::Base
  belongs_to :wiki,     :inverse_of => :wiki_contents

  def html_text
    if text == nil
      return ''
    else
      return $markdown.render(text)
    end
  end
end


class Wiki < ActiveRecord::Base
  has_many :wiki_tags
  has_many :tags,       :through => :wiki_tags,
                        :uniq => true

  has_many :wiki_contents

  validates :title, :length => { :in => 1..200 }

  def html_text
    text = ''

    newestContent = wiki_contents.order('created_at DESC').first
    if newestContent != nil
      text = newestContent.text
    end

    return $markdown.render(text)
  end

  def as_json(options={})
    super(
      :methods => :html_text,
      :include => :tags
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


class Tag < ActiveRecord::Base
  belongs_to :project,    :inverse_of => :tags
  has_many :note_tags
  has_many :notes,        :through => :note_tags

  has_many :task_tags
  has_many :tasks,        :through => :task_tags

  has_many :wiki_tags
  has_many :wikis,        :through => :wiki_tags

  validates :name,        :length => { :in => 1..32 }
  validates_uniqueness_of :name,  :scope => :project_id,
                                  :case_sensitive => false
  validates_format_of     :color, :with => /#[abcdefABCDEF0123456789]{6}/,
                                  :message => "Color must be an HTML color like #abcdef",
                                  :allow_nil => true

  def as_json(options={})
    super(
      :include => [ :note_tags, :task_tags ]
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

