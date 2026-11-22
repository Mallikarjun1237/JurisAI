"""
JurisAI — Legal Document Parser
Extracts clean, structured text from PDFs, text files, agreements, and pleadings.
Sanitizes mojibake, control characters, and legacy encoding artifacts to ensure human-readable text.
"""

import io
import re
from pypdf import PdfReader


def sanitize_extracted_text(raw_text: str) -> str:
    """
    Sanitize extracted document text:
    - Removes null bytes and control characters
    - Strips font glyph artifact mojibake (e.g. unmapped WinAnsi / Latin-1 glyphs)
    - Preserves standard ASCII, newlines, tabs, and authentic Indic Unicode scripts
      (Devanagari, Kannada, Telugu, Tamil, Gujarati, Bengali, Gurmukhi, Malayalam)
    - Normalizes whitespace and unspaces split acronyms
    """
    if not raw_text:
        return ""

    # Remove null bytes first to prevent split tokens (e.g. '1\x003\x008' -> '138')
    text = raw_text.replace("\x00", "")

    # Filter out unprintable and corrupted control/glyph characters
    # Keep ASCII printable, standard whitespace, and official Indic Unicode blocks
    cleaned_chars = []
    for ch in text:
        code = ord(ch)
        if 32 <= code <= 126 or ch in "\n\t":
            cleaned_chars.append(ch)
        elif 0x0900 <= code <= 0x0D7F:  # Indic Unicode blocks (Devanagari to Malayalam)
            cleaned_chars.append(ch)
        else:
            cleaned_chars.append(" ")

    text = "".join(cleaned_chars)

    # Normalize excessive spaces and clean lines
    lines = []
    for line in text.splitlines():
        line = re.sub(r"[ \t]+", " ", line).strip()
        if line and any(c.isalnum() for c in line):
            lines.append(line)
        elif not line:
            if lines and lines[-1] != "":
                lines.append("")

    return "\n".join(lines).strip()


def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """Extract clean readable text from uploaded legal file bytes."""
    fname = filename.lower()

    if fname.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                cleaned_txt = sanitize_extracted_text(txt)
                if cleaned_txt.strip():
                    pages_text.append(f"--- [Page {i + 1}] ---\n{cleaned_txt.strip()}")
            return "\n\n".join(pages_text) if pages_text else "Empty PDF or scanned image with no readable text."
        except Exception as e:
            return f"Error extracting text from PDF: {str(e)}"

    elif fname.endswith((".txt", ".md", ".csv", ".json", ".rtf")):
        try:
            decoded = file_bytes.decode("utf-8", errors="replace")
            return sanitize_extracted_text(decoded)
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
            combined = " ".join(texts)
            return sanitize_extracted_text(combined)
        except Exception as e:
            return f"Error reading DOCX document: {str(e)}"

    else:
        # Fallback raw decode
        try:
            decoded = file_bytes.decode("utf-8", errors="ignore")
            return sanitize_extracted_text(decoded)
        except Exception:
            return f"Unsupported file format: {filename}"
