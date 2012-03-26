# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20120326084856) do

  create_table "note_tags", :force => true do |t|
    t.integer "note_id"
    t.integer "tag_id"
  end

  add_index "note_tags", ["note_id", "tag_id"], :name => "index_note_tags_on_note_id_and_tag_id", :unique => true
  add_index "note_tags", ["tag_id"], :name => "note_tags_tag_id_fk"

  create_table "notes", :force => true do |t|
    t.integer  "project_id"
    t.text     "text"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "notes", ["project_id"], :name => "notes_project_id_fk"

  create_table "projects", :force => true do |t|
    t.string   "name"
    t.string   "github_repo"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
  end

  create_table "tags", :force => true do |t|
    t.integer "project_id"
    t.string  "name"
    t.string  "color",      :default => "#359AFF"
  end

  add_index "tags", ["project_id"], :name => "tags_project_id_fk"

  create_table "task_deps", :force => true do |t|
    t.integer "task_id"
    t.integer "dependency_id"
  end

  add_index "task_deps", ["dependency_id"], :name => "task_deps_dependency_id_fk"
  add_index "task_deps", ["task_id", "dependency_id"], :name => "index_task_deps_on_task_id_and_dependency_id", :unique => true

  create_table "task_tags", :force => true do |t|
    t.integer "task_id"
    t.integer "tag_id"
  end

  add_index "task_tags", ["tag_id"], :name => "task_tags_tag_id_fk"
  add_index "task_tags", ["task_id", "tag_id"], :name => "index_task_tags_on_task_id_and_tag_id", :unique => true

  create_table "tasks", :force => true do |t|
    t.integer  "project_id"
    t.string   "summary"
    t.text     "text"
    t.integer  "importance", :default => 0
    t.boolean  "completed",  :default => false
    t.boolean  "blocked",    :default => false
    t.datetime "due_date"
    t.datetime "created_at",                    :null => false
    t.datetime "updated_at",                    :null => false
  end

  add_index "tasks", ["project_id"], :name => "tasks_project_id_fk"

  create_table "wiki_contents", :force => true do |t|
    t.integer  "wiki_id"
    t.text     "text"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "wiki_contents", ["wiki_id"], :name => "wiki_contents_wiki_id_fk"

  create_table "wiki_tags", :force => true do |t|
    t.integer "wiki_id"
    t.integer "tag_id"
  end

  add_index "wiki_tags", ["tag_id"], :name => "wiki_tags_tag_id_fk"
  add_index "wiki_tags", ["wiki_id", "tag_id"], :name => "index_wiki_tags_on_wiki_id_and_tag_id", :unique => true

  create_table "wikis", :force => true do |t|
    t.integer  "project_id"
    t.string   "title"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "wikis", ["project_id"], :name => "wikis_project_id_fk"

  add_foreign_key "note_tags", "notes", :name => "note_tags_note_id_fk", :dependent => :delete
  add_foreign_key "note_tags", "tags", :name => "note_tags_tag_id_fk", :dependent => :delete

  add_foreign_key "notes", "projects", :name => "notes_project_id_fk", :dependent => :delete

  add_foreign_key "tags", "projects", :name => "tags_project_id_fk", :dependent => :delete

  add_foreign_key "task_deps", "tasks", :name => "task_deps_dependency_id_fk", :column => "dependency_id", :dependent => :delete
  add_foreign_key "task_deps", "tasks", :name => "task_deps_task_id_fk", :dependent => :delete

  add_foreign_key "task_tags", "tags", :name => "task_tags_tag_id_fk", :dependent => :delete
  add_foreign_key "task_tags", "tasks", :name => "task_tags_task_id_fk", :dependent => :delete

  add_foreign_key "tasks", "projects", :name => "tasks_project_id_fk", :dependent => :delete

  add_foreign_key "wiki_contents", "wikis", :name => "wiki_contents_wiki_id_fk", :dependent => :delete

  add_foreign_key "wiki_tags", "tags", :name => "wiki_tags_tag_id_fk", :dependent => :delete
  add_foreign_key "wiki_tags", "wikis", :name => "wiki_tags_wiki_id_fk", :dependent => :delete

  add_foreign_key "wikis", "projects", :name => "wikis_project_id_fk", :dependent => :delete

end
