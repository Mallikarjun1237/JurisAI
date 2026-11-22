with open("jurisai/backend/schemas.py", "a", encoding="utf-8") as f:
    f.write('''

class BareActProvisionDetail(BaseModel):
    id: str
    section_number: str
    marginal_heading: str
    citation: str
    text: str
    enacted_year: Optional[int] = None
    effective_date: Optional[str] = None


class BareActDetailResponse(BaseModel):
    act_id: str
    title: str
    year: int
    domain: str
    effective: Optional[str] = None
    repeals: Optional[str] = None
    overview: str
    key_applications: List[str] = []
    provisions: List[BareActProvisionDetail] = []
''')

print("Appended schemas successfully")
