import os, dotenv, time
dotenv.load_dotenv('jurisai/backend/.env')
from rag_service import get_rag_service

rag = get_rag_service()
t0 = time.time()
print('Testing rag.generate...')
result = rag.generate('My employer withheld my salary and terminated me without notice', is_pro=True, language='en')
print('Finished in:', round(time.time() - t0, 2), 's')
print('Model used:', result.get('telemetry', {}).get('model'))
print('Summary:', result.get('plain_english_summary')[:150])
print('Statutes count:', len(result.get('applicable_statutes', [])))
