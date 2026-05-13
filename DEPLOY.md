# Azure Static Web Apps deployment

## 1. Create the Static Web App
1. Sign in to the Azure Portal.
2. Select **Create a resource** > **Static Web App**.
3. Choose the **Free** plan.
4. Pick your subscription, resource group, region, and a name.
5. Under **Deployment details**, choose **GitHub** and authorize GitHub if prompted.
6. Select the `RRROCA/rrroca-site` repository and the `master` branch.
7. For the build preset, choose **Custom** and use:
   - **App location**: `/`
   - **Api location**: _(leave blank)_
   - **Output location**: `public`
8. Create the resource.

## 2. Get the deployment token
1. Open the new Static Web App in Azure Portal.
2. On the **Overview** page, select **Manage deployment token**.
3. Copy the token. If you ever need to rotate it, use **Reset token** and copy the new value.

## 3. Add the GitHub secret
1. Open the GitHub repository.
2. Go to **Settings** > **Secrets and variables** > **Actions**.
3. Create or update a repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`.
4. Paste the deployment token and save.

## 4. Deploy from GitHub Actions
1. Push to `master` to trigger production deployment.
2. Open a pull request targeting `master` to create a preview environment.
3. When the pull request is closed or merged, the preview environment is closed automatically.

## 5. Add the custom domain
1. In Azure Portal, open the Static Web App and go to **Custom domains**.
2. Add your preferred `www` host first (for example, `www.your-domain.example`).
3. Azure now validates ownership with a DNS **TXT** record; add the record Azure provides and wait for validation.
4. After validation, create a DNS **CNAME** record:
   - **Host**: `www`
   - **Points to**: your app's default hostname such as `orange-pond-123456.1.azurestaticapps.net`
5. For the apex domain, use your DNS provider's **ALIAS/ANAME/CNAME flattening** support if available, or forward the apex domain to your canonical `https://www` hostname.

## 6. SSL
- Azure Static Web Apps automatically provisions and renews SSL certificates for the default hostname and validated custom domains.
- No separate certificate purchase or renewal process is required.

## 7. Free tier limits to keep in mind
- **100 GB** included bandwidth per month
- **10** Static Web Apps per subscription
- **3** preview/staging environments per app
- **500 MB** total storage across environments
- **250 MB** max size per environment
- **15,000** files per app
- **2 custom domains** per app

## Notes
- The deployment workflow installs **Hugo Extended 0.161.1**, runs `hugo --gc --minify`, copies `staticwebapp.config.json` into `public/`, and deploys the built site to Azure Static Web Apps.
- `ci.yml` is PR-only validation and does not deploy.
