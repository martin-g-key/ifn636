# IFN636 Assignment1

Project Name: Mileage Tracker

## Quickstart

### Github Jira Integration
Each team member should use feature branches to work on code for their respective tickets. To integrate changes in Github with Jira, please prefix the jira key of the item you are working on. Examples below: 
* **feature branch names:** IA-15 Trips database table ticket should be its own branch. The jira key should be added at the start of the feature branch name (eg. "IA-15-trips-database-table")
* **commit messages:** committing the trips data base ticket should use a message that is prefixed with the Jira key e.g( "git commit -m "IA-15 trips database table") 
* **pull request titles:** when opening a pull request, prefix the message with the jira key (e.g. "IA-15 trips database table")

### Github Version Control
**Working on a feature branch**
```
git branch <jira key><branch>
git checkout <jira key><branch>
git status
git add .
git status
git commit -m "message” 
```

**Merging code into main**
```
git branch <jira key><branch>
git checkout <jira key><branch>
git add .
git commit -m "<jira key> message"
git push origin <jira key><branch>

git checkout main
git pull origin main
```

### Deployment Process 
**Pre-reqs** 

* Read and write access to https://github.com/martin-g-key/ifn636 will be enough to deploy changes to the production instance/s. 
* Make sure that the email address used for Jira and Git Hub. Github email can be checked using the below:
    `git config user.email`

**Process** 
1. Push to main  
2. Pull requests with at least one review required before merging
3. Runner on ec2 service connects to github on outbound HTTPS connection and picks up job
4. all build / test / deploy steps are run locally 



## Tech Stack 

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React & React Router | UI in browser, client side navigation |
| | Pico CSS 2 | Lightweight styling for plain HTML elements, no classes needed |
| | webpack 5 + Babel | Compiles JSX and bundles the app into `dist/`; injects `API_BASE` at build time |
| **Backend** | Node.js | JavaScript runtime for the API server |
| | Express  | REST API: routing plus middleware for CORS, JSON parsing and error handling |
| | jsonwebtoken + bcryptjs | Password hashing, 1-hour JWT login tokens, and Employer-only route protection |
| **Database** | MongoDB Atlas *(planned)* |  cloud data base |
| **CI/CD** | GitHub Actions (self-hosted runner) | On every push to `main`: install, build frontend, run tests, write `.env`, restart pm2 |
| **Testing** | Mocha + Chai | Test runner and assertions (backend and frontend) |
| | Supertest | Sends real HTTP requests to the Express app without starting a server |
| | Sinon | Spies, stubs and mocks for isolating code under test |
| **Version control** | Git + GitHub | Feature branches merged into `main` |


