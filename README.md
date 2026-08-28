# IFN636 Assignment1

Project Name: Mileage Tracker

## Quickstart

1. Open VS Code, connect to remote session using SSH credentials (for Elastic IP). Open a terminal window as well. Use own file path for pem file. 
    
    ssh -i "/Users/martin/local_inf636/mgkKeyPair.pem" ubuntu@54.253.93.151
    
2. Refresh main: 
    
    git checkout main
   
    git pull

3. check and select branch: 
   
    git branch
    
    git checkout -b [branch name]

3. Make changes

4. Stage --> Commit 
    
    git status
    
    git add .
    
    git commit -m "message"

5. Push to remote
    
    git push -u origin [branch name]

6. Merge Branch and Main
    
    git checkout main
    
    git pull
    
    git merge origin/branch

    git push

Check for unused branches. 

## Tech Stack 

| Layer | Technology | Role | 
| :--- | :---: | ---: |
| Frontend | react.js. | UI, running in browser |
| Frontend runtime | node.js | bundles react app |
| Frontend hosting | AWS Amplify | builds and serves React app |
| Backend | Python | server side logic, authentications |
| Backend hosting | AWS EC2 |
| Web | Flask | HTTP requests |
| Database | SQLite | simple relational database |
| Version Control | GitHub
| Testing | Mocha (runner) \ Chai (assertions) \ Sinon (test doubles) | Note: no pytest for backend. | 
| CI/CD | GitHub Actions | runs testing on each push |


## Architecture 

### Automatic Deployment

GitHub --> AWS Amplify --> Browser

### Manual Deployment:

Github --> Amazon EC2 --> API endpoint <--> SQLlite database

