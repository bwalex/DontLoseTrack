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

ActiveRecord::Schema.define(:version => 20120428091307) do

  create_table "document_tags", :force => true do |t|
    t.integer "document_id"
    t.integer "tag_id"
  end

  add_index "document_tags", ["document_id", "tag_id"], :name => "index_document_tags_on_document_id_and_tag_id", :unique => true
  add_index "document_tags", ["tag_id"], :name => "document_tags_tag_id_fk"

  create_table "documents", :force => true do |t|
    t.integer  "project_id"
    t.string   "name"
    t.string   "mimetype"
    t.text     "path"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "documents", ["project_id"], :name => "documents_project_id_fk"

  create_table "events", :force => true do |t|
    t.integer  "project_id"
    t.string   "type"
    t.datetime "occurred_at"
    t.datetime "created_at",        :null => false
    t.datetime "updated_at",        :null => false
    t.integer  "user_id"
    t.integer  "ext_resource_id"
    t.string   "fallback_username"
    t.text     "data"
  end

  add_index "events", ["ext_resource_id"], :name => "events_ext_resource_id_fk"
  add_index "events", ["occurred_at"], :name => "index_events_on_occurred_at"
  add_index "events", ["project_id"], :name => "events_project_id_fk"
  add_index "events", ["type"], :name => "index_events_on_type"
  add_index "events", ["user_id"], :name => "events_user_id_fk"

  create_table "ext_resources", :force => true do |t|
    t.integer  "project_id"
    t.string   "type"
    t.string   "location"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.text     "data"
  end

  add_index "ext_resources", ["project_id"], :name => "ext_resources_project_id_fk"

  create_table "mail_tags", :force => true do |t|
    t.integer "mail_id"
    t.integer "tag_id"
  end

  add_index "mail_tags", ["mail_id", "tag_id"], :name => "index_mail_tags_on_mail_id_and_tag_id", :unique => true
  add_index "mail_tags", ["tag_id"], :name => "mail_tags_tag_id_fk"

  create_table "mails", :force => true do |t|
    t.integer  "project_id"
    t.string   "from"
    t.string   "to"
    t.string   "cc"
    t.string   "subject"
    t.text     "body"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "mails", ["project_id"], :name => "mails_project_id_fk"

  create_table "note_tags", :force => true do |t|
    t.integer "note_id"
    t.integer "tag_id"
  end

  add_index "note_tags", ["note_id", "tag_id"], :name => "index_note_tags_on_note_id_and_tag_id", :unique => true
  add_index "note_tags", ["tag_id"], :name => "note_tags_tag_id_fk"

  create_table "notes", :force => true do |t|
    t.integer  "project_id"
    t.text     "text"
    t.datetime "created_at",        :null => false
    t.datetime "updated_at",        :null => false
    t.integer  "user_id"
    t.string   "fallback_username"
  end

  add_index "notes", ["project_id"], :name => "notes_project_id_fk"
  add_index "notes", ["user_id"], :name => "notes_user_id_fk"

  create_table "project_users", :force => true do |t|
    t.integer  "user_id"
    t.integer  "project_id"
    t.boolean  "is_owner"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "project_users", ["project_id", "user_id"], :name => "index_project_users_on_project_id_and_user_id", :unique => true
  add_index "project_users", ["user_id"], :name => "project_users_user_id_fk"

  create_table "projects", :force => true do |t|
    t.string   "name"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.integer  "owner_id"
  end

  add_index "projects", ["owner_id"], :name => "projects_owner_id_fk"

  create_table "sessions", :force => true do |t|
    t.string "session_id"
    t.text   "data"
  end

  add_index "sessions", ["session_id"], :name => "index_sessions_on_session_id", :unique => true

  create_table "settings", :force => true do |t|
    t.integer  "project_id"
    t.string   "key"
    t.string   "value"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "settings", ["key", "project_id"], :name => "index_settings_on_key_and_project_id", :unique => true
  add_index "settings", ["project_id"], :name => "settings_project_id_fk"

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

  create_table "user_project_settings", :force => true do |t|
    t.integer  "project_id"
    t.integer  "user_id"
    t.string   "key"
    t.string   "value"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "user_project_settings", ["key", "user_id", "project_id"], :name => "index_user_project_settings_on_key_and_user_id_and_project_id", :unique => true
  add_index "user_project_settings", ["project_id"], :name => "user_project_settings_project_id_fk"
  add_index "user_project_settings", ["user_id"], :name => "user_project_settings_user_id_fk"

  create_table "users", :force => true do |t|
    t.string   "name"
    t.string   "email"
    t.string   "email_hashed"
    t.string   "password"
    t.string   "salt"
    t.datetime "created_at",   :null => false
    t.datetime "updated_at",   :null => false
    t.string   "alias"
    t.string   "openid"
  end

  add_index "users", ["alias"], :name => "index_users_on_alias", :unique => true
  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["openid"], :name => "index_users_on_openid"

  create_table "wiki_contents", :force => true do |t|
    t.integer  "wiki_id"
    t.text     "comment"
    t.text     "text"
    t.datetime "created_at",        :null => false
    t.datetime "updated_at",        :null => false
    t.integer  "user_id"
    t.string   "fallback_username"
  end

  add_index "wiki_contents", ["user_id"], :name => "wiki_contents_user_id_fk"
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

  add_foreign_key "document_tags", "documents", :name => "document_tags_document_id_fk", :dependent => :delete
  add_foreign_key "document_tags", "tags", :name => "document_tags_tag_id_fk", :dependent => :delete

  add_foreign_key "documents", "projects", :name => "documents_project_id_fk", :dependent => :delete

  add_foreign_key "events", "ext_resources", :name => "events_ext_resource_id_fk", :dependent => :delete
  add_foreign_key "events", "projects", :name => "events_project_id_fk", :dependent => :delete
  add_foreign_key "events", "users", :name => "events_user_id_fk", :dependent => :nullify

  add_foreign_key "ext_resources", "projects", :name => "ext_resources_project_id_fk", :dependent => :delete

  add_foreign_key "mail_tags", "mails", :name => "mail_tags_mail_id_fk", :dependent => :delete
  add_foreign_key "mail_tags", "tags", :name => "mail_tags_tag_id_fk", :dependent => :delete

  add_foreign_key "mails", "projects", :name => "mails_project_id_fk", :dependent => :delete

  add_foreign_key "note_tags", "notes", :name => "note_tags_note_id_fk", :dependent => :delete
  add_foreign_key "note_tags", "tags", :name => "note_tags_tag_id_fk", :dependent => :delete

  add_foreign_key "notes", "projects", :name => "notes_project_id_fk", :dependent => :delete
  add_foreign_key "notes", "users", :name => "notes_user_id_fk", :dependent => :nullify

  add_foreign_key "project_users", "projects", :name => "project_users_project_id_fk", :dependent => :delete
  add_foreign_key "project_users", "users", :name => "project_users_user_id_fk", :dependent => :delete

  add_foreign_key "projects", "users", :name => "projects_owner_id_fk", :column => "owner_id"

  add_foreign_key "settings", "projects", :name => "settings_project_id_fk", :dependent => :delete

  add_foreign_key "tags", "projects", :name => "tags_project_id_fk", :dependent => :delete

  add_foreign_key "task_deps", "tasks", :name => "task_deps_dependency_id_fk", :column => "dependency_id", :dependent => :delete
  add_foreign_key "task_deps", "tasks", :name => "task_deps_task_id_fk", :dependent => :delete

  add_foreign_key "task_tags", "tags", :name => "task_tags_tag_id_fk", :dependent => :delete
  add_foreign_key "task_tags", "tasks", :name => "task_tags_task_id_fk", :dependent => :delete

  add_foreign_key "tasks", "projects", :name => "tasks_project_id_fk", :dependent => :delete

  add_foreign_key "user_project_settings", "projects", :name => "user_project_settings_project_id_fk", :dependent => :delete
  add_foreign_key "user_project_settings", "users", :name => "user_project_settings_user_id_fk", :dependent => :delete

  add_foreign_key "wiki_contents", "users", :name => "wiki_contents_user_id_fk", :dependent => :nullify
  add_foreign_key "wiki_contents", "wikis", :name => "wiki_contents_wiki_id_fk", :dependent => :delete

  add_foreign_key "wiki_tags", "tags", :name => "wiki_tags_tag_id_fk", :dependent => :delete
  add_foreign_key "wiki_tags", "wikis", :name => "wiki_tags_wiki_id_fk", :dependent => :delete

  add_foreign_key "wikis", "projects", :name => "wikis_project_id_fk", :dependent => :delete

end
