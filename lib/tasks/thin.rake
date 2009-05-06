namespace :thin do
  namespace :production do 
    desc "Start thin"
    task :start do
      sh "thin -C /etc/thin/tei.pauldyck.com start"
    end

    desc "Stop thin" 
    task :stop do
      sh "thin -C /etc/thin/tei.pauldyck.com stop"
    end

    desc "Restart thin" 
    task :restart do
      sh "thin -C /etc/thin/tei.pauldyck.com restart"
    end
  end
  
  namespace :development do 
    desc "Start thin"
    task :start do
      sh "thin -C /etc/thin/dev.tei.pauldyck.com start"
    end

    desc "Stop thin" 
    task :stop do
      sh "thin -C /etc/thin/dev.tei.pauldyck.com stop"
    end

    desc "Restart thin" 
    task :restart do
      sh "thin -C /etc/thin/dev.tei.pauldyck.com restart"
    end
  end
end
