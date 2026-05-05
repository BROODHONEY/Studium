# Report Template System Implementation

## Overview
A comprehensive report generation system has been implemented that allows admins to create customizable report templates and teachers to generate reports in multiple formats (CSV, XLSX, PDF).

## Features Implemented

### 1. Admin Panel - Report Template Configuration
**Location:** Institution Admin Dashboard → Report Templates tab

**Features:**
- ✅ Upload college logo (image files)
- ✅ Set college name with show/hide toggle
- ✅ Configure college name position (top-left, top-center, top-right)
- ✅ Configure logo position (top-left, top-center, top-right, side-left, side-right)
- ✅ Adjust logo size (small, medium, large)
- ✅ Set font size (8-20pt)
- ✅ Choose header color with color picker
- ✅ Live preview of template settings
- ✅ Save template settings per institution

### 2. Report Generation Modal (Teachers)
**Location:** Teacher Dashboard → Select students → Generate Report button

**Features:**
- ✅ Step 1: Format selection (CSV, XLSX, PDF)
- ✅ Step 2: Preview before download
- ✅ CSV: Plain text format (no logo/styling)
- ✅ XLSX: Styled Excel with logo and branding
- ✅ PDF: Professional document with logo and formatting
- ✅ Uses institution's template settings automatically

### 3. Backend API Endpoints

#### Report Templates
- `GET /api/report-templates` - Get template (admin only)
- `POST /api/report-templates` - Save/update template (admin only)
- `POST /api/report-templates/upload-logo` - Upload logo (admin only)
- `GET /api/report-templates/public` - Get template for teachers (read-only)

#### Report Generation
- `POST /api/reports/generate` - Generate XLSX or PDF report

## Files Created/Modified

### Frontend Components
1. **`frontend/src/components/ReportTemplatePanel.jsx`** (NEW)
   - Admin interface for template configuration
   - Logo upload functionality
   - Live preview component
   - Template settings form

2. **`frontend/src/components/ReportGeneratorModal.jsx`** (UPDATED)
   - Two-step modal (format selection → preview)
   - Format options: CSV, XLSX, PDF
   - Preview rendering for all formats
   - Download functionality

3. **`frontend/src/pages/InstitutionAdminDashboard.jsx`** (UPDATED)
   - Added "Report Templates" tab to navigation
   - Integrated ReportTemplatePanel component

### Backend Routes
1. **`backend/routes/reportTemplates.js`** (EXISTING - already in codebase)
   - Template CRUD operations
   - Logo upload handling
   - Institution-specific templates

2. **`backend/routes/reports.js`** (NEW)
   - XLSX generation using ExcelJS
   - PDF generation using PDFKit
   - Template-based styling

3. **`backend/index.js`** (UPDATED)
   - Registered `/api/report-templates` route
   - Registered `/api/reports` route

## Template Customization Options

### College Name
- Show/hide toggle
- Position: top-left, top-center, top-right
- Custom text input

### Logo
- Upload image (max 5MB)
- Show/hide toggle
- Position: top-left, top-center, top-right, side-left, side-right
- Size: small (40px), medium (60px), large (80px)

### Styling
- Font size: 8-20pt
- Header color: Custom color picker
- Automatic color application to headers and borders

## Report Formats

### CSV
- Plain comma-separated values
- No styling or logos
- Compatible with all spreadsheet apps
- Fastest generation

### XLSX (Excel)
- Styled headers with institution colors
- College name and logo (if enabled)
- Auto-fitted columns
- Professional formatting
- Generated timestamp footer

### PDF
- Professional document layout
- College logo and name (if enabled)
- Styled table with borders
- Custom font sizes
- Page breaks for large datasets
- Generated timestamp footer

## Usage Flow

### For Admins
1. Navigate to Admin Dashboard
2. Click "Report Templates" tab
3. Upload college logo
4. Configure college name and position
5. Adjust logo position and size
6. Set font size and header color
7. Preview changes in real-time
8. Click "Save Template"

### For Teachers
1. Navigate to Teacher Dashboard
2. Select students for report
3. Click "Generate Report" button
4. **Step 1:** Choose format (CSV/XLSX/PDF)
5. **Step 2:** Preview the report
6. Click "Download" to get the file

## Technical Details

### Dependencies Added
- `exceljs` - Excel file generation
- `pdfkit` - PDF document generation

### Database Schema
Table: `report_templates`
- `id` - Primary key
- `institution_id` - Foreign key to institutions
- `college_name` - Text
- `show_college_name` - Boolean
- `college_name_position` - Enum
- `logo_url` - Text (signed URL)
- `logo_position` - Enum
- `logo_size` - Enum
- `font_size` - Integer
- `header_color` - Text (hex color)
- `show_logo` - Boolean
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Security
- Admin-only access to template configuration
- File type validation for logo uploads
- File size limit (5MB)
- Institution-scoped templates
- Signed URLs for logo storage

## Preview System
The preview component renders a sample report showing:
- College name (if enabled)
- Logo (if enabled and uploaded)
- Sample data table (3 rows)
- Styled headers with institution colors
- Footer with generation date

## Next Steps (Optional Enhancements)
- [ ] Add more logo positions (bottom corners)
- [ ] Support for multiple logo formats
- [ ] Custom footer text
- [ ] Report templates for different report types
- [ ] Batch report generation
- [ ] Email reports directly
- [ ] Schedule automated reports

## Testing Checklist
- [ ] Admin can upload logo
- [ ] Admin can save template settings
- [ ] Preview updates in real-time
- [ ] Teachers can see format selection
- [ ] CSV download works
- [ ] XLSX download includes styling
- [ ] PDF download includes logo
- [ ] Template persists across sessions
- [ ] Multiple institutions have separate templates
