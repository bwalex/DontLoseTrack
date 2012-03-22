require 'rubygems'
require 'redcarpet'
require 'pygments'
require 'data_mapper'
require 'dm-validations'
require 'dm-timestamps'
require 'dm-serializer'

DataMapper::Logger.new($stdout, :debug)
DataMapper.setup(:default, 'sqlite:test.db')
#DataMapper.setup(:default, 'sqlite::memory:')

class Project
  include DataMapper::Resource

  property :id,           Serial
  property :name,         String,   :length => 1..32,
                                    :unique => true,
                                    :required => true

  property :github_repo,  String,   :required => false

  has n, :tags

  has n, :notes
  has n, :tasks
  has n, :emails
  has n, :wikis
  has n, :files
end



class NoteTag
  include DataMapper::Resource
  property :id,           Serial

  belongs_to :tag
  belongs_to :note
end


class TagTask
  include DataMapper::Resource
  property :id,           Serial

  belongs_to :tag
  belongs_to :task
end


class TagWiki
  include DataMapper::Resource
  property :id,           Serial

  belongs_to :tag
  belongs_to :wiki
end


class FileTag
  include DataMapper::Resource
  property :id,           Serial

  belongs_to :tag
  belongs_to :file
end


class Note
  include DataMapper::Resource

  property :id,           Serial
  property :text,         Text,     :required => true

  property :created_at,   DateTime

  has n, :tags, :through => :note_tags
end


class TaskDep
  include DataMapper::Resource

  property :id,           Serial

  belongs_to :task,       'Task'
  belongs_to :dependency, 'Task'
end


class Task
  include DataMapper::Resource
  
  property :id,           Serial
  property :summary,      String,   :length => 1..140,
                                    :required => true

  property :text,         Text,     :default => ''

  property :importance,   Integer,  :default => 1
  property :status,       Integer,  :default => 0


  property :created_at,   DateTime
  property :updated_at,   DateTime

  property :due_date,     DateTime

  has n, :tags, :through => :task_tags

  has n, :task_deps, :child_key => [ :task_id ]
  has n, :deps, self, :through => :task_deps, :via => :dependency

  NORMAL = 0
  BLOCKED = 1
  COMPLETED = 2
  DEPENDS = 3

  def html_text()
    if (text == nil)
      return ''
    else
      return $markdown.render(text)
    end
  end
end


class Email
  include DataMapper::Resource
  
  property :id,           Serial
  property :subject,      String,   :length => 1..256,
                                    :required => true

  property :text,         Text
  property :created_at,   DateTime

end


class Wiki
  include DataMapper::Resource
  
  property :id,           Serial
  property :title,        String,   :length => 1..140,
                                    :required => true

  property :created_at,   DateTime
  property :updated_at,   DateTime

  has n, :tags, :through => :wiki_tags
  has n, :wikiContents
end


class WikiContent
  include DataMapper::Resource

  property :id,           Serial

  property :text,         Text
  
  property :created_at,   DateTime
  property :update_at,    DateTime
end


class File
  include DataMapper::Resource
  property :id,           Serial
  property :file,         String, :length => 1..140,
                                  :required => true

  property :path,         String, :length => 1..1024,
                                  :required => true

  has n, :tags, :through => :file_tags
end
#class Bug
#end


class Tag
  include DataMapper::Resource
  
  property :id,           Serial
  property :name,         String,   :length => 1..32,
                                    :unique => false,
                                    :required => true

  property :color,        String,   :length => 2..7,
                                    :required => true

  belongs_to :project

  has n, :notes, :through => :note_tags
  has n, :tasks, :through => :task_tags
  has n, :wikis, :through => :wiki_tags
  has n, :files, :through => :file_tags
end


DataMapper.finalize
DataMapper.auto_upgrade!


class HTMLwithPygments < Redcarpet::Render::HTML
  def block_code(code, language)
    Pygments.highlight(code, :lexer => language)
  end
end


$markdown = Redcarpet::Markdown.new(
  HTMLwithPygments.new(:hard_wrap => true), {
    :autolink => true,
    :tables => true,
    :no_intra_empahsis => true,
    :strikethrough => true,
    :lax_html_blocks => true,
    :fenced_code_blocks => true,
    :space_after_headers => true
  })

def dm_errors_to_array(p)
  a = []
  if p.valid?
  else
    p.errors.each do |e|
      a = a << e[0]
    end
  end

  return a
end
