require 'sinatra'
require 'dalli'
require 'rack/cache'

set :env,  :production
disable :run

require './dlt.rb'

config = YAML::load(File.open('config/config.yml'))

use ActiveRecord::SessionStore

use Rack::Session::Cookie,
  :expire_after => nil

require 'rack/cache/key'
require 'rack/utils'

module Rack::Cache
  class Key
    # Generate a normalized cache key for the request.
    def generate
      parts = []
      parts << @request.session['user'] if defined? @request.session['user']
      parts << @request.scheme << "://"
      parts << @request.host

      if @request.scheme == "https" && @request.port != 443 ||
          @request.scheme == "http" && @request.port != 80
        parts << ":" << @request.port.to_s
      end

      parts << @request.script_name
      parts << @request.path_info

      if qs = query_string
        parts << "?"
        parts << qs
      end

      parts.join
    end
  end
end

if not config['cache'].nil? and config['cache']['store'] == 'memcache'
  puts "Using Rack::Cache"
  use Rack::Cache,
    :allow_reload     => false,
    :allow_revalidate => true,
    :verbose     => !config['silent'],
    :metastore   => 'memcached://' + config['cache']['location'] + '/' + config['cache']['key_prefix'] + ':meta',
    :entitystore => 'memcached://' + config['cache']['location'] + '/' + config['cache']['key_prefix'] + ':body'
end


##################################################################
######## Rack::OpenID setup
##################################################################

require 'openid/store/memcache'
require 'openid/store/filesystem'

require 'openid/store/nonce'
require 'openid/store/interface'

module OpenID::Store
  class Memcache < Interface
    def use_nonce(server_url, timestamp, salt)
      return false if (timestamp - Time.now.to_i).abs > Nonce.skew
      ts = timestamp.to_s # base 10 seconds since epoch
      nonce_key = key_prefix + 'N' + server_url + '|' + ts + '|' + salt
      result = @cache_client.add(nonce_key, '', expiry(Nonce.skew + 5))

      return result
    end
  end
end


require 'rack/openid'

if config['openid']['store'] == 'memcache'
  puts "Using Rack::OpenID"
  use Rack::OpenID,
    OpenID::Store::Memcache.new(
      Dalli::Client.new(config['openid']['location']),
      key_prefix=config['openid']['key_prefix']
    )
elsif config['openid']['store'] == 'filesystem'
  puts "Using Rack::OpenID"
  use Rack::OpenID,
    OpenID::Store::Filesystem.new(
      config['openid']['location']
    )
end

##################################################################
######## end Rack::OpenID setup
##################################################################


run Sinatra::Application
