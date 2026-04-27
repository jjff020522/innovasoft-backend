import json
import os
from urllib.parse import urljoin
from urllib.request import urlopen, Request

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
        from urllib.parse import urlencode
        url += '?' + urlencode(event['queryStringParameters'])

    # Headers, excluding some
    headers = {k: v for k, v in event.get('headers', {}).items()
               if k.lower() not in ['host', 'x-forwarded-for', 'x-netlify-headers']}

    # Data
    data = event.get('body')
    if data:
        data = data.encode('utf-8')

    # Forward the request
    req = Request(url, data=data, headers=headers, method=event['httpMethod'])
    try:
        with urlopen(req) as response:
            return {
                'statusCode': response.status,
                'headers': {k: v for k, v in response.headers.items() if k.lower() not in ['transfer-encoding']},
                'body': response.read().decode('utf-8')
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }