import requests
from urllib.parse import urlencode

CLIENT_ID = "ABDjG9Z2tWkFCzp4yUlulcSkbYGXtFYm0aDesgOIduZ2lugfoJ"
CLIENT_SECRET = "UZV9anDNSKHataV0jggZWHled9QGlRUwFjiTBk1P
REFRESH_TOKEN = "YOUR_REFRESH_TOKEN"   # from Playground
REDIRECT_URI = "https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl"

def refresh_access_token():
    url = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
    data = {
        "grant_type": "refresh_token",
        "refresh_token": REFRESH_TOKEN,
        "redirect_uri": REDIRECT_URI,
    }
    resp = requests.post(
        url,
        data=urlencode(data),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        auth=(CLIENT_ID, CLIENT_SECRET),
        timeout=30,
    )
    resp.raise_for_status()
    tokens = resp.json()
    return tokens["access_token"], tokens.get("refresh_token", REFRESH_TOKEN)

access_token, REFRESH_TOKEN = refresh_access_token()
# now call QBO with Authorization: Bearer {access_token}
