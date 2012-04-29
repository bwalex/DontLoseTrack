require './extres_common.rb'

def get_github_events(repo, page)
  j = http_json_request(
    "https://api.github.com/repos/#{repo}/events",
    { 'per_page' => '100', 'page' => page }
  )
end

def get_github_events_since(repo, last_id, last_date)
  events = []
  p = 1
  begin
    e = get_github_events(repo, p)
    events = events | e unless e.nil?
    p = p+1
  end while not e.nil? and e.last['id'].to_i > last_id and Time.parse(e.last['created_at']) > last_date

  events = events.keep_if { |e| e['id'].to_i > last_id and Time.parse(e['created_at']) > last_date }
end

ExtResource.where(:type => 'github').each do |e|
  cfg = {}
  if not e.data.nil?
    cfg = JSON.parse(e.data)
  end

  if cfg['last_id'].nil?
    cfg['last_id'] = 0
  end

  puts "Location: " + e.location
  puts "Last ID: " + cfg['last_id'].to_s

  events = get_github_events_since(e.location, cfg['last_id'], e.created_at)

  cfg['last_id'] = events.first['id'].to_i unless events.empty?

  events.each do |event|
    data = {
      'type'     => event['type'],
      'actor'    => event['actor'],
      'author'   => event['actor']['login']
    }

    case event['type']
    when "CommitCommentEvent"
      # XXX


    when "CreateEvent"
      # XXX
    when "DeleteEvent"
      #XXX


    when "ForkEvent"
      rp = event['payload']['forkee']
      data['name'] = rp['name']
      data['html_url'] = rp['html_url']
      users = User.where(:email_hashed => event['actor']['gravatar_id'])
      e.project.events.create!(
        :user               => (users.length > 0 ) ? users.first : nil,
        :fallback_username  => data['author'],
        :type               => 'extres:github:events:fork',
        :ext_resource       => e,
        :occurred_at        => Time.parse(event['created_at']),
        :data               => data.to_json
      )


    when "IssueCommentEvent"
      is = event['payload']['issue']
      co = event['payload']['comment']
      data['action'] = event['payload']['action']
      data['number'] = is['number']
      data['html_url'] = is['html_url']
      data['title'] = is['title']
      data['body'] = co['body']
      users = User.where(:email_hashed => event['actor']['gravatar_id'])
      e.project.events.create!(
        :user               => (users.length > 0 ) ? users.first : nil,
        :fallback_username  => data['author'],
        :type               => 'extres:github:events:issue_comment',
        :ext_resource       => e,
        :occurred_at        => Time.parse(event['created_at']),
        :data               => data.to_json
      )


    when "IssuesEvent"
      is = event['payload']['issue']
      data['action'] = event['payload']['action']
      data['number'] = is['number']
      data['html_url'] = is['html_url']
      data['title'] = is['title']
      data['body'] = is['body']
      users = User.where(:email_hashed => event['actor']['gravatar_id'])
      e.project.events.create!(
        :user               => (users.length > 0 ) ? users.first : nil,
        :fallback_username  => data['author'],
        :type               => 'extres:github:events:issue',
        :ext_resource       => e,
        :occurred_at        => Time.parse(event['created_at']),
        :data               => data.to_json
      )


    when "PullRequestEvent"
      pr = event['payload']['pull_request']
      data['number'] = event['payload']['number']
      data['action'] = event['payload']['action']
      data['html_url'] = pr['html_url']
      data['diff_url'] = pr['diff_url']
      data['patch_url'] = pr['patch_url']
      data['issue_url'] = pr['issue_url']
      data['title'] = pr['title']
      data['body'] = pr['body']
      users = User.where(:email_hashed => event['actor']['gravatar_id'])
      e.project.events.create!(
        :user               => (users.length > 0 ) ? users.first : nil,
        :fallback_username  => data['author'],
        :type               => 'extres:github:events:pullrequest',
        :ext_resource       => e,
        :occurred_at        => Time.parse(event['created_at']),
        :data               => data.to_json
      )


    when "PullRequestReviewCommentEvent"
      co = event['payload']['comment']
      data['html_url'] = co['_links']['html']['href']
      data['body'] = co['body']
      users = User.where(:email_hashed => event['actor']['gravatar_id'])
      e.project.events.create!(
        :user               => (users.length > 0 ) ? users.first : nil,
        :fallback_username  => data['author'],
        :type               => 'extres:github:events:pullrequest_comment',
        :ext_resource       => e,
        :occurred_at        => Time.parse(event['created_at']),
        :data               => data.to_json
      )


    when "PushEvent"
      event['payload']['commits'].each do |c|
        data['push_id'] = event['payload']['push_id']
        data['ref'] = event['payload']['ref']
        data['author'] = "#{c['author']['name']} <#{c['author']['email']}>"
        data['message'] = c['message']
        data['sha'] = c['sha']

        users = User.where(:email => c['author']['email'])
        e.project.events.create!(
          :user               => (users.length > 0 ) ? users.first : nil,
          :fallback_username  => data['author'],
          :type               => 'extres:github:events:commit',
          :ext_resource       => e,
          :occurred_at        => Time.parse(event['created_at']),
          :data               => data.to_json
        )
      end
    end
  end

  e.project.touch unless e.project.nil?
  e.data = cfg.to_json
  e.save!
end
