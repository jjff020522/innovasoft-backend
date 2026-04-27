import json
import os
import requests
from urllib.parse import urljoin

def handler(event, context):
    # Temporary simple response for debugging
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Function is working', 'path': event['path']})
    }