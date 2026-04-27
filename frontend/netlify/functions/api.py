import json
import os
import requests
from urllib.parse import urljoin

def handler(event, context):
    # Remove the /api prefix from the path
    path = event['path'].replace('/.netlify/functions/api', '', 1)
    if not path.startswith('/'):
        path = '/' + path

    # Base Railway URL
    railway_base = os.environ.get('RAILWAY_API_URL', 'https://innovasoft-backend-production.up.railway.app')

    # Full URL - add /api/ prefix since Railway API uses it
    api_path = 'api/' + path
    url = urljoin(railway_base, api_path.lstrip('/'))

    # Query params
    if event.get('queryStringParameters'):
        url += '?' + '&'.join([f"{k}={v}" for k, v in event['queryStringParameters'].items()])

    # Headers, excluding some
    headers = {k: v for k, v in event.get('headers', {}).items()
               if k.lower() not in ['host', 'x-forwarded-for', 'x-netlify-headers']}

    # Forward the request
    try:
        response = requests.request(
            method=event['httpMethod'],
            url=url,
            headers=headers,
            data=event.get('body'),
            timeout=30
        )

        return {
            'statusCode': response.status_code,
            'headers': {k: v for k, v in response.headers.items() if k.lower() not in ['transfer-encoding']},
            'body': response.text
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }