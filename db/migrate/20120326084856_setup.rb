require 'foreigner'

class Setup < ActiveRecord::Migration
  def self.up
    create_table :projects, :force => true do |t|
      t.string        :name
      t.string        :github_repo
      t.timestamps 
    end

    create_table :notes, :force => true do |t|
      t.text          :text
      t.timestamps
    end

    # XXX: Add foreign key for note<->tags ?
    #                      for task<->tags ?
    #                      for wiki<->tags ?

    create_table :tags, :force => true do |t|
      t.references    :project
      t.string        :name
      t.string        :color
    end


    create_table :tasks, :force => true do |t|
      t.references    :project
      t.string        :summary
      t.text          :text
      t.integer       :importance,    :default => 0
      t.boolean       :completed,     :default => false
      t.boolean       :blocked,       :default => false
      t.timestamps
    end


    create_table :wikis, :force => true do |t|
      t.references    :project
      t.string        :title
      t.timestamps
    end


    create_table :wiki_contents, :force => true do |t|
      t.references    :wiki
      t.text          :text
      t.timestamps
    end


    create_table :task_deps, :force => true do |t|
      t.references    :task
      t.integer       :dependency_id
    end


    create_table :task_tags, :force => true do |t|
      t.references    :task
      t.references    :tag
    end


    create_table :note_tags, :force => true do |t|
      t.references    :note
      t.references    :tag
    end


    create_table :wiki_tags, :force => true do |t|
      t.references    :wiki
      t.references    :tag
    end


    add_foreign_key(:wiki_contents, :wikis)

    add_foreign_key(:notes, :projects)
    add_foreign_key(:tasks, :projects)
    add_foreign_key(:wikis, :projects)

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
