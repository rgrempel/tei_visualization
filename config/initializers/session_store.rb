# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_tei_visualization_session',
  :secret      => 'd624611af9b93cf4997127700b0a84a0c755e4751cc76f57867454a91c6a090c91ba69ddc65d962a08486c0e8f3dc2cad5aba811f6901404bcad7a4b11e82277'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
