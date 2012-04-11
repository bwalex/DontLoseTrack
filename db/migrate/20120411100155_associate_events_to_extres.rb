class AssociateEventsToExtres < ActiveRecord::Migration
  def self.up
    change_table :events do |t|
      t.references :ext_resource
    end

    add_foreign_key(:events, :ext_resources, :dependent => :delete)

  end

  def self.down
    remove_column :events, :extresource_id
  end
end
