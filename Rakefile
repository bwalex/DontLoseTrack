require 'active_record'
require 'fileutils'
require './dlt.rb'
require 'foreigner'

ActiveRecord::Base.establish_connection(YAML::load(File.open('config/database.yml')))
ActiveRecord::Base.logger = Logger.new(STDOUT)


Foreigner.load

namespace :db do
  desc "migrate your database"
  task :migrate do
    ActiveRecord::Migrator.migrate(
      'db/migrate', 
      ENV["VERSION"] ? ENV["VERSION"].to_i : nil
    )
  end

  desc "create an ActiveRecord migration in ./db/migrate"
  task :create_migration do
    name = ENV['NAME']
    abort("no NAME specified. use `rake db:create_migration NAME=create_users`") if !name

    migrations_dir = File.join("db", "migrate")
    version = ENV["VERSION"] || Time.now.utc.strftime("%Y%m%d%H%M%S") 
    filename = "#{version}_#{name}.rb"
    migration_name = name.gsub(/_(.)/) { $1.upcase }.gsub(/^(.)/) { $1.upcase }

    FileUtils.mkdir_p(migrations_dir)

    open(File.join(migrations_dir, filename), 'w') do |f|
      f << (<<-EOS).gsub("      ", "")
      class #{migration_name} < ActiveRecord::Migration
        def self.up
        end

        def self.down
        end
      end
      EOS
    end
  end

  desc 'Output the schema to db/schema.rb'
  task :schema do
    File.open('db/schema.rb', 'w') do |f|
      ActiveRecord::SchemaDumper.dump(ActiveRecord::Base.connection, f)
    end
  end
end

namespace :tasks do
  desc "Run extres tasks"
  task :extres do
    f = File.new('./extres_bzr.rb')
    require './extres_bzr.rb' unless f.flock(File::LOCK_EX | File::LOCK_NB) == false
  end
end
