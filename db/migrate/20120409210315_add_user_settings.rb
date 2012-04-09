class AddUserSettings < ActiveRecord::Migration
  def self.up
    create_table :user_project_settings do |t|
      t.references     :project
      t.references     :user

      t.string         :key
      t.string         :value
      t.timestamps
    end

    add_foreign_key(:user_project_settings, :projects, :dependent => :delete)
    add_foreign_key(:user_project_settings, :users, :dependent => :delete)
    add_index :user_project_settings, [:key, :user_id, :project_id], :unique => true


  end

  def self.down
    drop_table :user_project_settings
  end
end
