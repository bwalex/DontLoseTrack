#require 'rubygems'
#require 'active_record'
#require 'foreigner'


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

  def as_json_ex
    return self.as_json(
      :methods => :html_text,
      :include => :tags
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

  def as_json_ex
    return
  end
end


class Wiki < ActiveRecord::Base
  has_many :tags,       :through => :wiki_tags,
                        :uniq => true

  has_many :wiki_contents

  validates :title, :length => { :in => 1..200 }

  def html_text
    text = ''

    newestContent = wiki_contents.order('created_at DESC').first
    if newestContent != nil
      text = newestContent.text

    return $markdown.render(text)
  end

  def as_json_ex
    return self.as_json(
      :methods => :html_text,
      :include => :tags
    )
  end
end


class NoteTag < ActiveRecord::Base
#  self.primary_keys = :note_id, :tag_id
  

  belongs_to :note
  belongs_to :tag
end


class TaskTag < ActiveRecord::Base
#  self.primary_keys = :task_id, :tag_id

  belongs_to :task
  belongs_to :tag
end


class Tag < ActiveRecord::Base
  belongs_to :project,    :inverse_of => :tags
  has_many :notes,        :through => :note_tags
  has_many :tasks,        :through => :task_tags
  has_many :wikis,        :through => :wiki_tags

  validates :name,        :length => { :in => 1..32 }
  validates_uniqueness_of :name, :scope => :project_id
  validates :color        :format => { :with => /#[abcdefABCDEF0123456789]{6}/,
                                       :message => "Color must be an HTML color like #abcdef" }
end


class TaskDep < ActiveRecord::Base
#  self.primary_keys :task_id, :dependency_id

  belongs_to :task
  belongs_to :dependency, :class_name => "Task",
                          :foreign_key => "dependency_id"
end


class Task < ActiveRecord::Base
  IMPORTANCE_NONE   = 0
  IMPORTANCE_LOW    = 1
  IMPORTANCE_MEDIUM = 2
  IMPORTANCE_HIGH   = 3

  belongs_to :project,  :inverse_of => :tasks

  has_many :tags,       :through => :task_tags,
                        :uniq => true

  has_many :task_deps
                        
  has_many :deps,       :through => :task_deps,
                        :source => :dependency

  validates :summary,   :length => { :in => 1..140 }

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

  def as_json_ex
    self.as_json(
      :methods => [
                    :html_text,
                    :status
                  ],
      :include => [
                    {:deps => { :methods => [:status], :only => [:id, :summary] }},
                    :tags
                  ]
    )
  end
end

