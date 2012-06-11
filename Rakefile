require 'active_record'
require 'fileutils'
require './dlt.rb'
require 'foreigner'


namespace :db do
  task :environment do
    env = ENV['ENVIRONMENT'] || ENV['RACK_ENV'] || 'development'
    dbconfig = YAML::load(File.open('config/database.yml'))
    ActiveRecord::Base.establish_connection(dbconfig[env])
    ActiveRecord::Base.logger = Logger.new(File.open('database.rakefile.log', 'w'))
    Foreigner.load
  end

  task :test_environment do
    dbconfig = YAML::load(File.open('config/database.yml'))
    ActiveRecord::Base.establish_connection(dbconfig['test'])
    ActiveRecord::Base.logger = Logger.new(File.open('database.rakefile.test.log', 'w'))
    Foreigner.load
  end

  desc "migrate the database (use version with VERSION=n)"
  task :migrate => :environment do
    ActiveRecord::Migrator.migrate(
      'db/migrate',
      ENV["VERSION"] ? ENV["VERSION"].to_i : nil
    )
  end

  desc "rolls back the migration (use steps with STEP=n)"
  task :rollback => :environment do
    ActiveRecord::Migrator.rollback(
      'db/migrate',
      ENV["STEP"] ? ENV["STEP"].to_i : nil
    )
  end

  desc "create an ActiveRecord migration in ./db/migrate"
  task :create_migration => :environment do
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

  namespace :schema do
    desc 'Output the schema to db/schema.rb (use SCHEMA=foo/bar to override)'
    task :dump => :environment do
      file = ENV['SCHEMA'] || 'db/schema.rb'
      File.open(file, 'w') do |f|
        ActiveRecord::SchemaDumper.dump(ActiveRecord::Base.connection, f)
      end
    end

    desc 'Load db/schema.rb file into the database (use SCHEMA=foo/bar to override)'
    task :load => :environment do
      file = ENV['SCHEMA'] || 'db/schema.rb'
      if File.exists?
        load file
      else
        abort "File not found"
      end
    end
  end

  task :schema => :'schema:dump'
end

namespace :tasks do
  desc "Run extres tasks"
  task :extres => :'database:environment' do
    f = File.new('./extres_bzr.rb')
    require './extres_bzr.rb' unless f.flock(File::LOCK_EX | File::LOCK_NB) == false
    f = File.new('./extres_github_events.rb')
    require './extres_github_events.rb' unless f.flock(File::LOCK_EX | File::LOCK_NB) == false
  end
end



namespace :tests do
  require 'cucumber/rake/task'
  require 'rspec/core/rake_task'

  Cucumber::Rake::Task.new(:cucumber) do |t|
    t.cucumber_opts = "features --format pretty"
  end
  task :cucumber => :'db:test_environment'

  RSpec::Core::RakeTask.new(:rspec) do |t|
    #t.rspec_path = 'bin/rspec'
    t.rspec_opts = %w[--color]
  end
  task :rspec => :'db:test_environment'

  task :all => [:cucumber, :rspec]
end

task :tests => :'tests:all'
