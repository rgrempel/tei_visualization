namespace :s3 do
  desc "Upload .git to s3"
  task :git do
    sh "git gc"
    sh "/usr/bin/s3cmd sync --delete-removed .git/ s3://s3.pauldyck.com/tei_visualization.git/"
  end

  desc "Download .git from s3"
  task :gitfroms3 do
    sh "/usr/bin/s3cmd sync --delete-removed s3://s3.pauldyck.com/tei_visualization.git/ .git/"
  end
end
