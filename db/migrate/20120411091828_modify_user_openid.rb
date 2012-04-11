class ModifyUserOpenid < ActiveRecord::Migration
  def self.up
    change_table :users do |t|
      t.string       :alias
      t.string       :openid
    end

    add_index :users, :openid, :unique => false #otherwise we can't have NULLs
    add_index :users, :alias, :unique => true

    user = User.first

    change_table :projects do |t|
      t.integer      :owner_id
    end

    add_foreign_key(:projects, :users, :column => 'owner_id')

    Project.all.each do |p|
      unless p.users.exists?(user)
        p.users << user
        p.save
      end
      p.owner = user
      p.save
    end
  end

  def self.down
    remove_foreign_key(:projects, :column => 'owner_id')
    remove_column :projects, :owner_id
    remove_column :users, :openid
  end
end
