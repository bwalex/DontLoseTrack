class EventsAbstract < ActiveRecord::Migration
  def self.up
    Event.destroy_all
    remove_column :events, :summary
    remove_column :events, :body
    change_table :events do |e|
      e.text  :data
    end
  end

  def self.down
    remove_column :events, :data
    change_table :events do |e|
      e.text    :body
      e.string  :summary
    end
  end
end
