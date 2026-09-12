import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_borders(cell, top="CCCCCC", bottom="CCCCCC", left=None, right=None):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{top}"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{bottom}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

def add_callout(doc, text, title="KEY TAKEAWAY", border_color="4F46E5", bg_color="EEF2FF"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border only
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"📌 {title}: ")
    run_t.bold = True
    run_t.font.color.rgb = RGBColor(79, 70, 229)
    run_t.font.size = Pt(10.5)
    
    run_b = p.add_run(text)
    run_b.font.size = Pt(10)
    run_b.font.color.rgb = RGBColor(30, 41, 59)
    doc.add_paragraph()

def build_presentation_document(output_path):
    doc = Document()
    
    # Page setup - Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # Styles definition
    styles = doc.styles
    normal_style = styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(51, 65, 85)
    
    # ----------------------------------------------------
    # COVER PAGE / HEADER
    # ----------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(30)
    title_p.paragraph_format.space_after = Pt(8)
    title_run = title_p.add_run("CivicPothole AI")
    title_run.bold = True
    title_run.font.size = Pt(30)
    title_run.font.color.rgb = RGBColor(30, 58, 138) # Deep Blue
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(16)
    sub_run = sub_p.add_run("AI-Powered Road Defect Detection, Citizen Reporting & Municipal Dispatch Platform")
    sub_run.font.size = Pt(15)
    sub_run.font.color.rgb = RGBColor(79, 70, 229) # Indigo
    
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_before = Pt(0)
    meta_p.paragraph_format.space_after = Pt(28)
    meta_run = meta_p.add_run("Comprehensive Technical Presentation & Architectural Specification\nAuthor: Fawaz Mulla | Architecture: Monolithic FastAPI + YOLOv8 + React 19 | Status: Production Ready")
    meta_run.font.size = Pt(9.5)
    meta_run.italic = True
    meta_run.font.color.rgb = RGBColor(100, 116, 139)
    
    doc.add_heading("1. Executive Summary", level=1)
    
    p = doc.add_paragraph(
        "CivicPothole AI is an end-to-end municipal governance and road safety technology platform designed to automate the discovery, triage, and repair lifecycle of civic road defects. By uniting state-of-the-art computer vision (YOLOv8 fine-tuned on dedicated pothole datasets), real-time citizen reporting with automated GPS geotagging, and an administrative Municipal Command Center (CMS), the platform transforms unstructured citizen complaints into structured, actionable engineering tasks."
    )
    
    add_callout(
        doc,
        "CivicPothole AI eliminates 90%+ of manual inspection latency by computing defect bounding boxes, surface area ratios, and severity tiers in under 150 milliseconds upon image submission.",
        "CORE VALUE PROPOSITION"
    )
    
    # ----------------------------------------------------
    # 2. THE CIVIC PROBLEM STATEMENT
    # ----------------------------------------------------
    doc.add_heading("2. Problem Statement & Market Urgency", level=1)
    
    p = doc.add_paragraph(
        "Road infrastructure deterioration poses severe hazards to urban mobility, causing thousands of vehicular accidents, severe traffic bottlenecks, and costly vehicular damage annually. Municipal road maintenance agencies face chronic bottlenecks:"
    )
    
    bullet1 = doc.add_paragraph(style='List Bullet')
    r = bullet1.add_run("Delayed Incident Detection: ")
    r.bold = True
    bullet1.add_run("Cities rely on periodic manual survey vehicles or bureaucratic paper complaints, taking weeks to record severe craters.")
    
    bullet2 = doc.add_paragraph(style='List Bullet')
    r = bullet2.add_run("Duplicate & Unstructured Submissions: ")
    r.bold = True
    bullet2.add_run("A single prominent pothole on a major arterial road triggers dozens of identical phone complaints, flooding municipal staff with redundant tickets.")
    
    bullet3 = doc.add_paragraph(style='List Bullet')
    r = bullet3.add_run("Lack of Objective Severity Scoring: ")
    r.bold = True
    bullet3.add_run("Text-based reports fail to convey accurate dimensions or hazard levels, making emergency prioritization impossible.")
    
    bullet4 = doc.add_paragraph(style='List Bullet')
    r = bullet4.add_run("Zero Audit Trail for Resolution: ")
    r.bold = True
    bullet4.add_run("Citizens have no visibility into contractor dispatch, while authorities lack photo-verified proof of repair before closing work orders.")

    # ----------------------------------------------------
    # 3. SOLUTION OVERVIEW
    # ----------------------------------------------------
    doc.add_heading("3. The CivicPothole AI Solution", level=1)
    
    p = doc.add_paragraph(
        "CivicPothole AI establishes a closed-loop civic ecosystem connecting citizens, automated computer vision engines, and municipal engineers in real time:"
    )
    
    # Table of 3 Pillars
    table = doc.add_table(rows=4, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    headers = ["1. Citizen Reporting Portal", "2. YOLOv8 AI Core", "3. Authority CMS Command Center"]
    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 120, 120, 120, 120)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h)
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(10)
        
    pillar_data = [
        ("• Instant photo upload & camera capture\n• GPS auto-location reverse tagging\n• Real-time AI preview & overlay",
         "• Fine-tuned YOLOv8 neural network\n• Bounding box coordinate regression\n• Confidence thresholding (0.25–1.0)",
         "• Real-time municipal dashboard metrics\n• Ward & Contractor dispatch routing\n• Status lifecycle state machine"),
        ("• Live reference tracking ID (e.g. #CP-9812)\n• Status progression timeline\n• Citizen feedback transparency",
         "• Defect surface area calculation\n• Dynamic severity rating (LOW/MED/HIGH)\n• Annotated visual overlay rendering",
         "• Before/After photo resolution audit\n• SLA tracking & high-severity alerts\n• Geolocation spatial distribution"),
        ("• Clean, responsive mobile-first UI\n• Dark/Light theme adaptability\n• Zero registration friction",
         "• Real-time CPU/GPU dynamic dispatch\n• Sub-150ms inference latency\n• OpenCV headless image processing",
         "• Departmental delegation (PWD, Ward)\n• Complete inspection notes logging\n• Secure administrative access")
    ]
    
    for row_idx, row_content in enumerate(pillar_data, start=1):
        for col_idx, text in enumerate(row_content):
            cell = table.cell(row_idx, col_idx)
            bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 100, 100, 100, 100)
            set_cell_borders(cell)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(text)
            run.font.size = Pt(9.5)
            
    doc.add_paragraph() # Spacing
    
    # ----------------------------------------------------
    # 4. SYSTEM ARCHITECTURE & MONOLITHIC BLUEPRINT
    # ----------------------------------------------------
    doc.add_heading("4. Full-Stack Monolithic Architecture", level=1)
    
    p = doc.add_paragraph(
        "CivicPothole AI is engineered as a unified, zero-friction monolithic web application where FastAPI serves both the production React Single Page Application (SPA) bundle and the asynchronous AI REST API endpoints from a single port and host:"
    )
    
    arch_box = doc.add_paragraph()
    arch_box.paragraph_format.space_before = Pt(6)
    arch_box.paragraph_format.space_after = Pt(6)
    r = arch_box.add_run(
        "┌────────────────────────────────────────────────────────────────────────┐\n"
        "│                      Client Web Browser (Citizen / Authority)          │\n"
        "│                React 19 + TypeScript + Tailwind CSS + Radix UI         │\n"
        "└───────────────────────────────────┬────────────────────────────────────┘\n"
        "                                    │ HTTP / REST (Same-Origin)\n"
        "                                    ▼\n"
        "┌────────────────────────────────────────────────────────────────────────┐\n"
        "│                   FastAPI Monolithic Web Application                   │\n"
        "│                                                                        │\n"
        "│  ┌───────────────────────┐ ┌──────────────────────┐ ┌───────────────┐  │\n"
        "│  │ Static SPA Files      │ │ AI Inference Router  │ │ Complaint API │  │\n"
        "│  │ - index.html / assets │ │ - /api/detect        │ │ - /api/*      │  │\n"
        "│  └───────────────────────┘ └──────────┬───────────┘ └───────┬───────┘  │\n"
        "│                                       │                     │          │\n"
        "│                                       ▼                     ▼          │\n"
        "│                           ┌───────────────────────┐ ┌────────────────┐ │\n"
        "│                           │ Ultralytics YOLOv8    │ │ SQLite / DB    │ │\n"
        "│                           │ Custom Pothole Model  │ │ Data Store     │ │\n"
        "│                           └───────────────────────┘ └────────────────┘ │\n"
        "└────────────────────────────────────────────────────────────────────────┘"
    )
    r.font.name = 'Consolas'
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor(30, 41, 59)
    
    doc.add_heading("5. AI Computer Vision & Severity Scoring Pipeline", level=1)
    
    p = doc.add_paragraph(
        "The AI pipeline leverages an optimized YOLOv8 neural network trained specifically on road defect imagery (PeterHdd/pothole-detection-yolo provenance). When a photo is uploaded, the inference service executes the following sequence:"
    )
    
    s1 = doc.add_paragraph(style='List Bullet')
    s1.add_run("1. Image Normalization: ").bold = True
    s1.add_run("The byte stream is decoded via OpenCV, converted to RGB color space, and resized preserving aspect ratio.")
    
    s2 = doc.add_paragraph(style='List Bullet')
    s2.add_run("2. Tensor Inference: ").bold = True
    s2.add_run("The preprocessed tensor passes through the YOLOv8 backbone, outputting feature maps across 3 distinct scales (detecting small fissures to massive craters).")
    
    s3 = doc.add_paragraph(style='List Bullet')
    s3.add_run("3. Defect Area & Spatial Ratio Calculation: ").bold = True
    s3.add_run("For each bounding box [x1, y1, x2, y2], the surface area ratio is computed against total image resolution:")
    
    math_p = doc.add_paragraph()
    math_p.paragraph_format.left_indent = Inches(0.5)
    math_r = math_p.add_run("Area Ratio = (Box Width × Box Height) / (Image Width × Image Height)")
    math_r.bold = True
    math_r.font.color.rgb = RGBColor(79, 70, 229)
    
    s4 = doc.add_paragraph(style='List Bullet')
    s4.add_run("4. Automated Severity Classification: ").bold = True
    s4.add_run("The platform mathematically determines hazard priority without human bias:")
    
    # Severity Table
    sev_table = doc.add_table(rows=4, cols=3)
    sev_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    sev_headers = ["Severity Level", "Mathematical Criteria", "Municipal SLA Action"]
    for col_idx, h in enumerate(sev_headers):
        cell = sev_table.cell(0, col_idx)
        set_cell_background(cell, "334155")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(9.5)
        
    sev_rows = [
        ("CRITICAL / HIGH", "Area Ratio ≥ 8% OR Pothole Count ≥ 3 OR Confidence ≥ 85%", "Immediate emergency dispatch (< 24 Hours)"),
        ("MEDIUM", "3% ≤ Area Ratio < 8% OR Single Defined Pothole", "Scheduled ward maintenance (< 72 Hours)"),
        ("LOW", "Area Ratio < 3% (Minor surface fissure / early defect)", "Routine road resurfacing list (< 7 Days)")
    ]
    
    for r_idx, (s_lvl, s_crit, s_act) in enumerate(sev_rows, start=1):
        cell0 = sev_table.cell(r_idx, 0)
        cell1 = sev_table.cell(r_idx, 1)
        cell2 = sev_table.cell(r_idx, 2)
        set_cell_margins(cell0, 80, 80, 80, 80)
        set_cell_margins(cell1, 80, 80, 80, 80)
        set_cell_margins(cell2, 80, 80, 80, 80)
        set_cell_borders(cell0)
        set_cell_borders(cell1)
        set_cell_borders(cell2)
        
        bg = "FEF2F2" if "HIGH" in s_lvl else ("FFFBEB" if "MEDIUM" in s_lvl else "F0FDF4")
        set_cell_background(cell0, bg)
        set_cell_background(cell1, bg)
        set_cell_background(cell2, bg)
        
        cell0.paragraphs[0].add_run(s_lvl).bold = True
        cell1.paragraphs[0].add_run(s_crit).font.size = Pt(9)
        cell2.paragraphs[0].add_run(s_act).font.size = Pt(9)
        
    doc.add_paragraph()

    # ----------------------------------------------------
    # 6. MUNICIPAL DISPATCH & WORKFLOW LIFECYCLE
    # ----------------------------------------------------
    doc.add_heading("6. Municipal Governance & Audit Lifecycle", level=1)
    
    p = doc.add_paragraph(
        "To ensure transparency and prevent complaints from falling through bureaucratic cracks, CivicPothole AI enforces a strict status lifecycle state machine:"
    )
    
    status_p = doc.add_paragraph()
    status_p.paragraph_format.left_indent = Inches(0.2)
    sr = status_p.add_run("REPORTED  ➔  ACKNOWLEDGED  ➔  IN PROGRESS  ➔  RESOLVED  (or REJECTED)")
    sr.bold = True
    sr.font.color.rgb = RGBColor(16, 185, 129)
    
    doc.add_paragraph("Key governance mechanisms include:")
    
    g1 = doc.add_paragraph(style='List Bullet')
    g1.add_run("Ward & Department Allocation: ").bold = True
    g1.add_run("Complaints are assigned directly to designated municipal wards (e.g. Ward 12 - Central) and engineering officers.")
    
    g2 = doc.add_paragraph(style='List Bullet')
    g2.add_run("Before & After Photo Proof: ").bold = True
    g2.add_run("Work orders cannot be transitioned to 'RESOLVED' without uploading verified post-repair site photographs and timestamped inspection notes.")
    
    g3 = doc.add_paragraph(style='List Bullet')
    g3.add_run("Citizen Live Tracking: ").bold = True
    g3.add_run("Citizens track progress by entering their unique reference code without requiring login credentials.")

    # ----------------------------------------------------
    # 7. REST API SPECIFICATIONS
    # ----------------------------------------------------
    doc.add_heading("7. Complete REST API Specifications", level=1)
    
    api_table = doc.add_table(rows=8, cols=4)
    api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    api_headers = ["Method", "Endpoint Route", "Purpose", "Response Format"]
    for col_idx, h in enumerate(api_headers):
        cell = api_table.cell(0, col_idx)
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(9.5)
        
    api_data = [
        ("POST", "/api/detect", "Upload image for instant YOLOv8 inference & bounding boxes", "JSON (boxes, severity, overlay)"),
        ("POST", "/api/complaints", "Submit new verified citizen defect complaint", "JSON (Complaint entity)"),
        ("GET", "/api/complaints", "Query complaints with filtering by status/severity/ward", "JSON (Array of complaints)"),
        ("GET", "/api/complaints/{id}", "Fetch single complaint details and audit history", "JSON (Complaint entity)"),
        ("PATCH", "/api/complaints/{id}/status", "Update status (UNDER_REVIEW, IN_PROGRESS, etc.)", "JSON (Updated complaint)"),
        ("PATCH", "/api/complaints/{id}/assign", "Assign complaint to officer & municipal department", "JSON (Updated complaint)"),
        ("POST", "/api/complaints/{id}/resolve", "Submit before/after repair proof & resolve defect", "JSON (Resolved complaint)")
    ]
    
    for r_idx, (m, ep, purp, resp) in enumerate(api_data, start=1):
        c0 = api_table.cell(r_idx, 0)
        c1 = api_table.cell(r_idx, 1)
        c2 = api_table.cell(r_idx, 2)
        c3 = api_table.cell(r_idx, 3)
        set_cell_margins(c0, 60, 60, 60, 60)
        set_cell_margins(c1, 60, 60, 60, 60)
        set_cell_margins(c2, 60, 60, 60, 60)
        set_cell_margins(c3, 60, 60, 60, 60)
        set_cell_borders(c0)
        set_cell_borders(c1)
        set_cell_borders(c2)
        set_cell_borders(c3)
        
        c0.paragraphs[0].add_run(m).bold = True
        c1.paragraphs[0].add_run(ep).font.name = 'Consolas'
        c1.paragraphs[0].runs[0].font.size = Pt(8.5)
        c2.paragraphs[0].add_run(purp).font.size = Pt(9)
        c3.paragraphs[0].add_run(resp).font.size = Pt(8.5)
        
    doc.add_paragraph()

    # ----------------------------------------------------
    # 8. PRODUCTION DEPLOYMENT & RENDER CLOUD SETUP
    # ----------------------------------------------------
    doc.add_heading("8. Cloud Deployment & DevOps Architecture", level=1)
    
    p = doc.add_paragraph(
        "The application is engineered for zero-maintenance containerized cloud deployment on Render via a single unified Blueprint (render.yaml):"
    )
    
    dep1 = doc.add_paragraph(style='List Bullet')
    dep1.add_run("Unified Build Script: ").bold = True
    dep1.add_run("The build pipeline compiles the React 19 frontend into static production assets and installs the Python AI backend dependencies in a single deterministic pass:")
    
    cmd_p = doc.add_paragraph()
    cmd_p.paragraph_format.left_indent = Inches(0.5)
    cr = cmd_p.add_run("cd frontend && npm install && npm run build && cd .. && pip install -r backend/requirements.txt")
    cr.font.name = 'Consolas'
    cr.font.size = Pt(8.5)
    cr.font.color.rgb = RGBColor(15, 23, 42)
    
    dep2 = doc.add_paragraph(style='List Bullet')
    dep2.add_run("Model Context Protocol (MCP) Integration: ").bold = True
    dep2.add_run("The platform is hooked into the official hosted Render MCP server (https://mcp.render.com/mcp), empowering AI agents to monitor logs, analyze metrics, and trigger deploys automatically.")
    
    # ----------------------------------------------------
    # 9. FUTURE ROADMAP & EXTENSIBILITY
    # ----------------------------------------------------
    doc.add_heading("9. Strategic Future Roadmap", level=1)
    
    f1 = doc.add_paragraph(style='List Bullet')
    f1.add_run("Dashcam Continuous Video Stream Analysis: ").bold = True
    f1.add_run("Mounting edge cameras on public municipal buses and sanitation trucks to map entire city road networks autonomously.")
    
    f2 = doc.add_paragraph(style='List Bullet')
    f2.add_run("GIS Heatmap & Predictive Budget Allocation: ").bold = True
    f2.add_run("Machine learning forecasting to predict road degradation prior to monsoon seasons, saving municipal corporations millions in emergency asphalt repairs.")
    
    f3 = doc.add_paragraph(style='List Bullet')
    f3.add_run("Citizen Civic Gamification: ").bold = True
    f3.add_run("Rewarding active reporting citizens with civic tax credits or utility rebates for keeping neighborhoods safe.")

    # Save document
    doc.save(output_path)
    print(f"Presentation document saved successfully to: {output_path}")

if __name__ == "__main__":
    out_file = os.path.abspath("presentation.docx")
    build_presentation_document(out_file)
