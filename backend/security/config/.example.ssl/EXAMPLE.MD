## Create the folder called .ssl and paste the shared content at level of /config


### You can check the integrity of the files whit 

```bash
openssl x509 -in .ssl/postgresql-ca.crt -text -noout                                                  
openssl x509 -in .ssl/client.crt -text -noout
```