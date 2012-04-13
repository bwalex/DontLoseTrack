require './bzrwrapper-my.rb'

ExtResource.where(:type => 'bazaar').each do |e|
  cfg = {}
  if not e.data.nil?
    cfg = JSON.parse(e.data)
  end

  unless not cfg['last_commit_id'].nil?
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

  branch.log.each_entry do |entry|
    # entry.time
    # entry.revno
    # entry.message
    # entry.committer
    if entry.time > e.created_at and entry.revno.to_i > cfg['last_commit_id']
      committer_mail = entry.committer.scan(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/i).uniq
      users = User.where(:email => committer_mail)
      e.project.events.create!(
      #moo = {
        :user => (users.length > 0 ) ? users.first : nil,
        :fallback_username => entry.committer,
        :type => 'extres',
        :ext_resource => e,
        :occurred_at => entry.time,
        :summary => "Commit revision <a href='http://bazaar.launchpad.net/" + e.location[3..-1] + "/revision/" + entry.revno + "'>" + entry.revno + "</a> to <span class='timeline-bzr-location'>" + e.location + "</span>",
        :body => "<span class='timeline-bzr'><blockquote>" + entry.message  + "</blockquote></span>"
      )
      #}
      #puts moo.to_json
      #puts '---------------------'
    end
  end

  cfg['last_commit_id'] = branch.info.revno.to_i;
  # e.project
  # e.location
  # e.data
  # e.updated_at
  #

  e.data = cfg.to_json
  e.save!
  #puts cfg.to_json
end
