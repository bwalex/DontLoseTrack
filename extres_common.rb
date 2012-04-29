require 'net/http'
require 'net/https'

def http_json_request(url, params)
  uri = URI(url)
  uri.query = URI.encode_www_form(params) unless params.nil?

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = (uri.scheme == 'https') ? true : false
  res = http.request_get(uri.path + '?' + uri.query)

  if res.is_a?(Net::HTTPSuccess)
    return JSON.parse(res.body)
  else
    return nil
  end
end
