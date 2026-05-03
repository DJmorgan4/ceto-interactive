from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import uuid, json, os
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Ceto Site Intelligence Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

jobs: dict = {}
OUTPUTS_DIR = Path("outputs/reports")
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

class AOI(BaseModel):
    type: str = "Polygon"
    coordinates: List

class Transect(BaseModel):
    start: List[float]
    end: List[float]

class JobRequest(BaseModel):
    aoi: Optional[AOI] = None
    bbox: List[float]
    center: List[float]
    transect: Optional[Transect] = None
    datasets: List[str] = ["usgs_3dep", "macrostrat", "soilgrids", "nhd", "osm"]
    outputs: List[str] = ["hillshade", "slope", "drainage", "geology", "soils", "cross_section", "pdf"]
    project_name: Optional[str] = "Site Intelligence Report"

class JobStatus(BaseModel):
    job_id: str
    status: str
    created_at: str
    updated_at: str
    progress: Optional[int] = 0
    message: Optional[str] = None
    report_id: Optional[str] = None
    error: Optional[str] = None

def update_progress(job_id: str, progress: int, message: str):
    if job_id in jobs:
        jobs[job_id]["progress"] = progress
        jobs[job_id]["message"] = message
        jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()

def run_pipeline(job_id: str, request: JobRequest):
    from backend.pipeline import generate_site_report
    jobs[job_id]["status"] = "running"
    jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()
    try:
        report_id = str(uuid.uuid4())
        report_dir = OUTPUTS_DIR / report_id
        report_dir.mkdir(parents=True, exist_ok=True)
        generate_site_report(
            job_id=job_id, report_id=report_id,
            bbox=request.bbox, center=request.center,
            aoi=request.aoi.dict() if request.aoi else None,
            transect=request.transect.dict() if request.transect else None,
            datasets=request.datasets, outputs=request.outputs,
            project_name=request.project_name, output_dir=str(report_dir),
            progress_callback=lambda p, msg: update_progress(job_id, p, msg),
        )
        jobs[job_id].update({"status": "complete", "progress": 100, "report_id": report_id, "updated_at": datetime.utcnow().isoformat(), "message": "Report complete"})
    except Exception as e:
        jobs[job_id].update({"status": "failed", "error": str(e), "updated_at": datetime.utcnow().isoformat()})
        raise

@app.get("/")
def root(): return {"service": "Ceto Site Intelligence Engine", "status": "online"}

@app.get("/health")
def health(): return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/jobs", response_model=JobStatus)
def create_job(request: JobRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    jobs[job_id] = {"job_id": job_id, "status": "queued", "created_at": now, "updated_at": now, "progress": 0, "message": "Job queued", "report_id": None, "error": None}
    background_tasks.add_task(run_pipeline, job_id, request)
    return jobs[job_id]

@app.get("/api/jobs/{job_id}", response_model=JobStatus)
def get_job(job_id: str):
    if job_id not in jobs: raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

@app.get("/api/reports/{report_id}")
def get_report(report_id: str):
    path = OUTPUTS_DIR / report_id / "metadata.json"
    if not path.exists(): raise HTTPException(status_code=404, detail="Report not found")
    with open(path) as f: return json.load(f)

@app.get("/api/reports/{report_id}/download")
def download_report(report_id: str):
    pdf = OUTPUTS_DIR / report_id / "report.pdf"
    if not pdf.exists(): raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(path=str(pdf), media_type="application/pdf", filename=f"site-intel-{report_id[:8]}.pdf")

@app.get("/api/reports/{report_id}/maps/{map_name}")
def get_map(report_id: str, map_name: str):
    p = OUTPUTS_DIR / report_id / "maps" / map_name
    if not p.exists(): raise HTTPException(status_code=404, detail="Map not found")
    return FileResponse(path=str(p), media_type="image/png")


@app.get("/api/jobs")
def list_jobs():
    return list(jobs.values())
