class AddDataToExtres < ActiveRecord::Migration
  def self.up
    change_table :ext_resources do |t|
      t.text         :data
    end
  end

  def self.down
    remove_column :ext_resources, :data
  end
end
