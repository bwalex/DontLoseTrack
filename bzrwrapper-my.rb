# BzrWrapper is a simple tool to extract information from
# bazaar-branches (http://bazaar-vcs.org)
# it gives u the opportunity to extract log/commits/version-info
#--
# Author::    rene paulolat (mailto: rene@so36.net)
# Copyright:: Copyright (c) 2007 rene paulokat
# License::   
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

module BzrWrapper
  require 'time'
  
  # represents bazaar-branch
  #
  class Branch
  
    # filepath to the bazaar-branch
    attr_reader :path
    
    # initiate instance with path to existent 
    # bazaar-branch
    # :call-seq: 
    #     BzrWrapper::Branch.new('/your/path/to/branch')    -> BzrWrapper::Branch
    #
    def initialize(path)
      @path = path
    end
    
    # returns BzrWrapper::Log
    #
    def log
      @log || create_log
    end

    def info
      @info || create_info
    end
    private 
    
    # wraps system-call 'bzr version-info'
    # and creates BzrWrapper::Info 
    #
    def create_info
        arr = []
        hash = {}
        cmd = 'bzr version-info ' << @path
        IO.popen(cmd) do |io|
          unless io.eof?
            io.readlines.each do |line|
                k , v = line.split(':',2)
                hash[k] = v
            end
          end
        end
        ['date','revno','branch-nick','revision-id'].each { |x| raise BzrException.new("no such info-key:: #{x}")  unless hash.has_key?(x)  }
        @info = Info.new(hash['date'], hash['revno'], hash['branch-nick'], hash['revision-id'])
    end
    
    # wraps system-call 'bzr log --forward'
    # and returns BzrWrapper::Log
    #
    def create_log(forward=true,start=1, stop=-1)
      @entries = []
      cmd = "bzr log " << @path
        offsets = []
        arr = IO.popen(cmd).readlines
        arr.each_index { |x| offsets.push(x) if arr[x].strip.chomp == Log::SEPARATOR  }
        while not offsets.empty?
          hash = {}
          start = @_tmp || offsets.shift
          stop = if offsets.empty? 
                  -1
                 else 
                  @_tmp = offsets.shift
                  @_tmp
                 end
          _arr = arr[start..stop]
          _arr.each_index { |x| _arr.delete_at(x) if _arr[x].strip.chomp == Log::SEPARATOR }
          _arr.each_with_index do |line,i| 
            if line.match('message:') 
              hash['message'] = _arr[i+1].chomp.strip unless _arr[i+1].nil?
            else
              line.gsub!('branch nick:', 'branch_nick:') if line.match('branch nick:') 
              ['revno:','committer:','branch_nick:','timestamp:','merged:'].each do |thing|
                if line.match(thing)
                  hash[line.split(':',2)[0].chomp.strip] = line.split(':',2)[1].chomp.strip
                end
              end
            end
          end
          @entries.push(Commit.new(hash['revno'],hash['committer'], hash['branch_nick'], hash['timestamp'], hash['message'],hash['merged']))
        end
      @log = Log.new(@entries)
    end
  end
  
  # class representing status-information of given bazaar-branch
  #
  class Info
    # date of last commit
    attr_reader :date 
    # latest revision-number
    attr_reader :revno
    # name/nick of the branch
    attr_reader :branch_nick
    # latest revision-id
    attr_reader :revision_id
    
    def initialize(date_string, revision, nick, revision_id)
      @date,@revno,@branch_nick, @revision_id = Time.parse(date_string.chomp.strip), revision.chomp, nick.chomp, revision_id.chomp
    end
    
    def to_s
      "revision: #{@revno} | date: #{@date.to_s} | branch-nick: #{@branch_nick} | revision-id: #{@revision_id}"
    end
  end
  
  # represents the branch-log
  # with <n> 'Commit's
  #
  class Log
    SEPARATOR = '------------------------------------------------------------'
    # num of log-entries 
    attr_reader :count
    # array of BzrWrapper::Commit's of this BzrWrapper::Log
    attr_reader :commits
    
    def initialize(le_array, &block)
      @count = le_array.length
      @commits = le_array
      block_given? ? @commits.each { |x| yield x }  : self
    end
    
    # Iterates over supplied Commits.
    def each_entry
      block_given? ? @commits.each { |c| yield c } : @commits
    end

  end
  
  # represents single commit / checkin
  # 
  class Commit
    attr_reader :revno, :committer, :branch_nick, :timestamp, :message, :merged
    
    def initialize(revno,committer,branch_nick,timestamp,message,merged=nil)
      @revno,@committer,@branch_nick,@timestamp,@message,@merged = revno,committer,branch_nick,timestamp,message,merged
    end
    
    # returns time-object of this commit
    #
    def time
      Time.parse(@timestamp)
    end
    
  end
  
  class BzrException < Exception
  end
  
end
#include BzrWrapper
