@dir = "/path/to/app"

worker_processes 4
#working_directory @dir

preload_app true

timeout 30
listen "127.0.0.1:4567"

pid "unicorn.pid"


puts "RACK ENV: #{ENV["RACK_ENV"]}"


# Set the path of the log files inside the log folder of the testapp
#stderr_path "/var/rails/testapp/log/unicorn.stderr.log"
#stdout_path "/var/rails/testapp/log/unicorn.stdout.log"

before_fork do |server, worker|
# This option works in together with preload_app true setting
# What is does is prevent the master process from holding
# the database connection
  #defined?(ActiveRecord::Base) and
    #ActiveRecord::Base.connection.disconnect!
end

after_fork do |server, worker|
# Here we are establishing the connection after forking worker
# processes
  config = YAML::load(File.open('config/config.yml'))

  dbconfig = YAML::load(File.open('config/database.yml'))
  ActiveRecord::Base.establish_connection(dbconfig[ENV["RACK_ENV"]])

  if ENV["RACK_ENV"] == "development"
    ActiveRecord::Base.logger = Logger.new(STDOUT)
  else
    ActiveRecord::Base.logger = Logger.new(File.open('database.log', 'w'))
  end
end
