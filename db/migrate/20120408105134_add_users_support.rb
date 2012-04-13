Foreigner.load


class AddUsersSupport < ActiveRecord::Migration
  def self.up


    create_table :users do |t|
      t.string         :name
      t.string         :email
      t.string         :email_hashed #for gravatar
      t.string         :password
      t.string         :salt
      t.timestamps
    end

    add_index :users, :email, :unique => true


    create_table :project_users do |t|
      t.references     :user
      t.references     :project
      t.boolean        :is_owner

      t.timestamps
    end

    add_foreign_key(:project_users, :users, :dependent => :delete)
    add_foreign_key(:project_users, :projects, :dependent => :delete)
    add_index :project_users, [:project_id, :user_id], :unique => true


    #user = User.create!(
    #  :name => 'Alex',
    #  :email => 'ahornung@gmail.com',
    #  :email_hashed => '2c43830740ae6439e6842cbe65eb9210',
    #  :password => '',
    #  :salt => ''
    #)


    change_table :events do |t|
      t.references      :user
    end

    add_foreign_key(:events, :users, :dependent => :nullify)
    #Event.update_all ["user_id = ?", user.id]


    change_table :notes do |t|
      t.references      :user
    end

    add_foreign_key(:notes, :users, :dependent => :nullify)
    #Note.update_all ["user_id = ?", user.id]


    change_table :wiki_contents do |t|
      t.references      :user
    end

    add_foreign_key(:wiki_contents, :users, :dependent => :nullify)
    #WikiContent.update_all ["user_id = ?", user.id]
  end



  def self.down
    remove_foreign_key(:wiki_contents, :column => 'user_id')
    remove_foreign_key(:notes, :column => 'user_id')
    remove_foreign_key(:events, :column => 'user_id')
    remove_foreign_key(:project_users, :column => 'user_id')
    remove_foreign_key(:project_users, :column => 'project_id')
    drop_table :project_users
    remove_column :events, :user_id
    remove_column :notes, :user_id
    remove_column :wiki_contents, :user_id
    drop_table :users
  end
end
