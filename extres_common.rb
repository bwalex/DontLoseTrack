require 'net/http'
require 'net/https'
require 'json'
require 'oauth'
require 'oauth/signature/plaintext'


class SimpleHTTPRequest
  attr_reader :res, :req

  def initialize(url, method = 'get')
    @uri = URI(url)
    @http = Net::HTTP.new(@uri.host, @uri.port)
    @http.use_ssl = (@uri.scheme == 'https')
    @req = Net::HTTP::Get.new(@uri.request_uri)  if method == 'get'
    @req = Net::HTTP::Post.new(@uri.request_uri) if method == 'post'
    @method = method
  end


  def body= b
    @req.body= b if method == 'post'
  end


  def content_type= ct
    @req.content_type= ct if method == 'post'
  end


  def oauth! (opts)
    cons = OAuth::Consumer.new(opts[:consumer], opts[:consumer_secret])
    tok  = OAuth::Token.new(opts[:token], opts[:token_secret])
    @req.oauth!(@http, cons, tok, {
      :signature_method => opts[:signature_method]
    })
    #puts @req.each_header {|key,value| puts "#{key} = #{value}" }
  end


  def form_data= fd
    if @method == 'get'
      @uri.query = URI.encode_www_form(fd)
      @req = Net::HTTP::Get.new(@uri.request_uri)
    elsif @method == 'post'
      @req.set_form_data(fd)
    end
  end


  def result(expected_content_type = nil)
    @res = @http.request(@req)
    if res.is_a? Net::HTTPSuccess
      if expected_content_type.nil?
        case res.content_type
        when "application/json"
          return JSON.parse(@res.body)
        when "application/x-www-form-urlencoded"
          d = URI.decode_www_form(@res.body)
          return Hash[d]
        else
          return @res.body
        end
      elsif expected_content_type == 'json'
        return JSON.parse(@res.body)
      elsif expected_content_type == 'form'
        d = URI.decode_www_form(@res.body)
        return Hash[d]
      end
    else
      return nil
    end
  end
end
