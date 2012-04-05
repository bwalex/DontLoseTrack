Foreigner.load

class Setup < ActiveRecord::Migration
  def self.up
    create_table :projects, :force => true do |t|
      t.string        :name
      t.timestamps 
    end


    create_table :settings :force => true do |t|
      t.references     :project
      t.string         :key
      t.string         :value
      t.timestamps
    end

    add_foreign_key(:settings, :projects, :dependent => :delete)
    add_index :settings, :key, :unique => true


    create_table :ext_resources :force => true do |t|
      t.references     :project
      t.string         :type
      t.string         :location
      t.timestamps
    end

    add_foreign_key(:ext_resources, :projects, :dependent => :delete)


    create_table :events :force => true do |t|
      t.references     :project
      t.string         :type
      t.string         :summary
      t.string         :body
      t.datetime       :occurred_at
      t.timestamps
    end

    add_foreign_key(:events, :projects, :dependent => :delete)
    add_index :events, :type, :unique => false
    add_index :events, :occurred_at, :unique => false


    create_table :tags, :force => true do |t|
      t.references    :project
      t.string        :name
      t.string        :color,         :default => "#359AFF"
    end

    add_foreign_key(:tags, :projects, :dependent => :delete)


    create_table :files, :force => true do |t|
      t.references    :project
      t.string        :name
      t.string        :mimetype
      t.text          :path
      t.timestamps
    end

    add_foreign_key(:files, :projects, :dependent => :delete)


    create_table :mails, :force => true do |t|
      t.references    :project
      t.string        :from
      t.string        :to
      t.string        :cc
      t.string        :subject
      t.text          :body
      t.timestamps
    end

    add_foreign_key(:mails, :projects, :dependent => :delete)


    create_table :notes, :force => true do |t|
      t.references    :project
      t.text          :text
      t.timestamps
    end

    add_foreign_key(:notes, :projects, :dependent => :delete)


    create_table :tasks, :force => true do |t|
      t.references    :project
      t.string        :summary
      t.text          :text
      t.integer       :importance,    :default => 0
      t.boolean       :completed,     :default => false
      t.boolean       :blocked,       :default => false
      t.datetime      :due_date
      t.timestamps
    end

    add_foreign_key(:tasks, :projects, :dependent => :delete)


    create_table :wikis, :force => true do |t|
      t.references    :project
      t.string        :title
      t.timestamps
    end

    add_foreign_key(:wikis, :projects, :dependent => :delete)


    create_table :wiki_contents, :force => true do |t|
      t.references    :wiki
      t.text          :comment
      t.text          :text
      t.timestamps
    end

    add_foreign_key(:wiki_contents, :wikis, :dependent => :delete)


#    #CPK:
#    execute "CREATE TABLE `task_deps` (`task_id` int, `dependency_id` int, PRIMARY KEY(`task_id`, `dependency_id`))  ENGINE=InnoDB"


    create_table :task_deps, :force => true do |t|
      t.references    :task
      t.integer       :dependency_id
    end

    add_foreign_key(:task_deps, :tasks, :column => 'task_id', :dependent => :delete)
    add_foreign_key(:task_deps, :tasks, :column => 'dependency_id', :dependent => :delete)
    add_index :task_deps, [:task_id, :dependency_id], :unique => true


    create_table :task_tags, :force => true do |t|
      t.references    :task
      t.references    :tag
    end

    add_foreign_key(:task_tags, :tasks, :dependent => :delete)
    add_foreign_key(:task_tags, :tags, :dependent => :delete)
    add_index :task_tags, [:task_id, :tag_id], :unique => true


    create_table :note_tags, :force => true do |t|
      t.references    :note
      t.references    :tag
    end

    add_foreign_key(:note_tags, :notes, :dependent => :delete)
    add_foreign_key(:note_tags, :tags, :dependent => :delete)
    add_index :note_tags, [:note_id, :tag_id], :unique => true


    create_table :wiki_tags, :force => true do |t|
      t.references    :wiki
      t.references    :tag
    end

    add_foreign_key(:wiki_tags, :wikis, :dependent => :delete)
    add_foreign_key(:wiki_tags, :tags, :dependent => :delete)
    add_index :wiki_tags, [:wiki_id, :tag_id], :unique => true



    create_table :mail_tags, :force => true do |t|
      t.references    :mail
      t.references    :tag
    end

    add_foreign_key(:mail_tags, :mails, :dependent => :delete)
    add_foreign_key(:mail_tags, :tags, :dependent => :delete)
    add_index :mail_tags, [:mail_id, :tag_id], :unique => true



    create_table :file_tags, :force => true do |t|
      t.references    :file
      t.references    :tag
    end

    add_foreign_key(:file_tags, :files, :dependent => :delete)
    add_foreign_key(:file_tags, :tags, :dependent => :delete)
    add_index :file_tags, [:file_id, :tag_id], :unique => true




  end

  def self.down
    drop_table :projects
    drop_table :ext_resources
    drop_table :settings
    drop_table :files
    drop_table :mails
    drop_table :notes
    drop_table :tags
    drop_table :tasks
    drop_table :wikis
    drop_table :wiki_contents
    drop_table :task_deps
    drop_table :task_tags
    drop_table :note_tags
    drop_table :wiki_tags
    drop_table :mail_tags
    drop_table :file_tags
  end
end
