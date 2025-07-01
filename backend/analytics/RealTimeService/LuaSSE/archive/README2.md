# Lua for large scale and heavy services

Why we select this language with this proposal?
Well there is many not full understandig requirements however Lua is a great option to solve High work loads is known to manage heavy configuration files and is used in game development.

### Point to clarify and remain before release.
We need to install different dependencies extremely light to operate with Lua and our host must to be LINUX based environment.

## Integrate dependencies

Install Lua via apt:
- apt install lua5.4

Install Lua package manager (Luarocks):
- apt install luarocks


Set up openresty:
```
[
  - curl -O https://openresty.org/package/pubkey.gpg
  
  - gpg --dearmor -o /usr/share/keyrings/openresty.gpg pubkey.gpg
  
  - echo "deb [signed-by=/usr/share/keyrings/openresty.gpg] http://openresty.org/package/ubuntu $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/openresty.list


  - sudo apt-get install -y openresty
  
  - openresty -V


]
```

Remember not to enable openresty could use 80 PORT and affect main NGINX configuration or instance, if any error related with ports is displayed please disable openresty

- systemctl disable openresty.service

Another packages needed:
```
- sudo /usr/local/openresty/bin/opm get ledgetech/lua-resty-http

- sudo /usr/local/openresty/bin/resty --version  # Check if resty is installed
  
- curl -L https://github.com/openresty/opm/releases/latest/download/opm_linux_amd64 -o /usr/local/bin/opm
```



### Key commands
This command will set the NGINX lua service online without delete previous release:
- openresty -p . -c nginx.conf -s reload

This one is for looking the process that is busy our main PORT:
- sudo lsof -i :1234


# Result real-time events information
We completely avoid all the resources that WS(websocket) consumes with our compiled strategy warranty at least 90% time up without failures

![alt text](RealTimeEvents.png)