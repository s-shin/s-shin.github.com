# encoding: utf-8

require "erb"
require "json"

def main
  @index = JSON.parse(open("index.json").read)
  ERB.new(open("index.html.erb").read).run(binding)
end

main if __FILE__ == $0
