require './bzrwrapper-my.rb'
require 'net/http'
require 'net/https'

def get_lp_info(location)
  uri = URI('https://api.launchpad.net/1.0/branches')
  params = { 'ws.op' => 'getByUrl', :url => location }
  uri.query = URI.encode_www_form(params)

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  res = http.request_get(uri.path + '?' + uri.query)

  if res.is_a?(Net::HTTPSuccess)
    return JSON.parse(res.body)
  else
    return {}
  end
end

ExtResource.where(:type => 'bazaar').each do |e|
  cfg = {}
  if not e.data.nil?
    cfg = JSON.parse(e.data)
  end

  if cfg['last_commit_id'].nil?
    cfg['last_commit_id'] = 0
  end

  puts "Location: " + e.location

  branch = BzrWrapper::Branch.new(e.location)
  puts branch.info.to_s

  puts 'last_commit_id: ' +  cfg['last_commit_id'].to_s
  if (cfg['last_commit_id'] >= branch.info.revno.to_i)
    puts "Already up to date at rev: " + branch.info.revno;
    next
  end

  cfg['lp_info'] = get_lp_info(e.location)

  branch.log.each_entry do |entry|
    # Relevant information:
    #  entry.time
    #  entry.revno
    #  entry.message
    #  entry.committer
    if entry.time > e.created_at and entry.revno.to_i > cfg['last_commit_id']
      committer_mail = entry.committer.scan(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i).uniq
      users = User.where(:email => committer_mail)
      data = {
        'id'        => e.id,
        'location'  => e.location,
        'revision'  => entry.revno,
        'message'   => entry.message,
        'committer' => entry.committer,
        'time'      => entry.time
      }
      e.project.events.create!(
        :user               => (users.length > 0 ) ? users.first : nil,
        :fallback_username  => entry.committer,
        :type               => 'extres:bzr',
        :ext_resource       => e,
        :occurred_at        => entry.time,
        :data               => data.to_json
      )

      # 'Touch' the project so that it looks updated to the caching mechanisms
      e.project.touch unless e.project.nil?
    end
  end

  cfg['last_commit_id'] = branch.info.revno.to_i;

  e.data = cfg.to_json
  e.save!
end
