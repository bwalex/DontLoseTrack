class AddFallbackUsername < ActiveRecord::Migration
  def self.up
    change_table :events do |t|
      t.string        :fallback_username
    end

    change_table :notes do |t|
      t.string        :fallback_username
    end

    change_table :wiki_contents do |t|
      t.string        :fallback_username
    end
  end



  def self.down
    remove_column :events, :fallback_username
    remove_column :notes,  :fallback_username
    remove_column :wiki_contents, :fallback_username
  end
end
