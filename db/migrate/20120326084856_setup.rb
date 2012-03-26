Foreigner.load

class Setup < ActiveRecord::Migration
  def self.up
    create_table :projects, :force => true do |t|
      t.string        :name
      t.string        :github_repo
      t.timestamps 
    end


    create_table :tags, :force => true do |t|
      t.references    :project
      t.string        :name
      t.string        :color
    end


    add_foreign_key(:tags, :projects)
    create_table :notes, :force => true do |t|
      t.references    :project
      t.text          :text
      t.timestamps
    end

    add_foreign_key(:notes, :projects)


    create_table :tasks, :force => true do |t|
      t.references    :project
      t.string        :summary
      t.text          :text
      t.integer       :importance,    :default => 0
      t.boolean       :completed,     :default => false
      t.boolean       :blocked,       :default => false
      t.timestamps
    end

    add_foreign_key(:tasks, :projects)


    create_table :wikis, :force => true do |t|
      t.references    :project
      t.string        :title
      t.timestamps
    end

    add_foreign_key(:wikis, :projects)


    create_table :wiki_contents, :force => true do |t|
      t.references    :wiki
      t.text          :text
      t.timestamps
    end

    add_foreign_key(:wiki_contents, :wikis)


#    #CPK:
#    execute "CREATE TABLE `task_deps` (`task_id` int, `dependency_id` int, PRIMARY KEY(`task_id`, `dependency_id`))  ENGINE=InnoDB"


    create_table :task_deps, :force => true do |t|
      t.references    :task
      t.integer       :dependency_id
    end

    add_foreign_key(:task_deps, :tasks, :column => 'task_id')
    add_foreign_key(:task_deps, :tasks, :column => 'dependency_id')
    add_index :task_deps, [:task_id, :dependency_id], :unique => true


    create_table :task_tags, :force => true do |t|
      t.references    :task
      t.references    :tag
    end

    add_foreign_key(:task_tags, :tasks)
    add_foreign_key(:task_tags, :tags)
    add_index :task_tags, [:task_id, :tag_id], :unique => true


    create_table :note_tags, :force => true do |t|
      t.references    :note
      t.references    :tag
    end

    add_foreign_key(:note_tags, :notes)
    add_foreign_key(:note_tags, :tags)
    add_index :note_tags, [:note_id, :tag_id], :unique => true


    create_table :wiki_tags, :force => true do |t|
      t.references    :wiki
      t.references    :tag
    end

    add_foreign_key(:wiki_tags, :wikis)
    add_foreign_key(:wiki_tags, :tags)
    add_index :wiki_tags, [:wiki_id, :tag_id], :unique => true



  end

  def self.down
    drop_table :projects
    drop_table :notes
    drop_table :tags
    drop_table :tasks
    drop_table :wikis
    drop_table :wiki_contents
    drop_table :task_deps
    drop_table :task_tags
    drop_table :note_tags
    drop_table :wiki_tags
  end
end
