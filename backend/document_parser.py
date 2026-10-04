"""
JurisAI — Legal Document Parser
Extracts clean, structured text from PDFs, text files, agreements, and pleadings.
"""

import io
from pypdf import PdfReader


def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """Extract clean readable text from uploaded legal file bytes."""
    fname = filename.lower()

    if fname.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                if txt.strip():
                    pages_text.append(f"--- [Page {i + 1}] ---\n{txt.strip()}")
            return "\n\n".join(pages_text) if pages_text else "Empty PDF or scanned image with no readable text."
        except Exception as e:
            return f"Error extracting text from PDF: {str(e)}"

    elif fname.endswith((".txt", ".md", ".csv", ".json", ".rtf")):
        try:
            return file_bytes.decode("utf-8", errors="replace")
        except Exception as e:
            return f"Error reading text file: {str(e)}"

    elif fname.endswith(".docx"):
        try:
            import zipfile
            import xml.etree.ElementTree as ET

            # Extract word/document.xml without needing heavy external dependencies
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            # Find all paragraph text elements
            texts = [node.text for node in tree.iter() if node.text]
            return " ".join(texts)
        except Exception as e:
            return f"Error reading DOCX document: {str(e)}"

    else:
        # Fallback raw decode
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return f"Unsupported file format: {filename}"
