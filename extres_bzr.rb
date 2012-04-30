require './bzrwrapper-my.rb'
require './extres_common.rb'

def get_lp_info(location)
  s = SimpleHTTPRequest.new('https://api.launchpad.net/1.0/branches')
  s.form_data = { 'ws.op' => 'getByUrl', :url => location }
  j = s.result

  return (j.nil?) ? { } : j
end


ExtResource.where(:type => 'bazaar').each do |e|
  cfg = {}
  if not e.data.nil?
    cfg = JSON.parse(e.data)
  end

  if cfg['last_commit_id'].nil?
    cfg['last_commit_id'] = 0
  end

  #puts "Location: " + e.location
  branch = BzrWrapper::Branch.new(e.location)
  if branch.info.nil? or branch.log.nil?
    warn "Invalid bazaar external resource: " << e.location
    next
  end

  if (cfg['last_commit_id'] >= branch.info.revno.to_i)
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
