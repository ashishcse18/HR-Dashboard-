import { Injectable, signal, computed } from '@angular/core';

export interface CompanyFolder {
  id: string;
  name: string;
  logo: string; // SVG or fontawesome icon class
  description: string;
  color: string; // Brand accent color
}

export interface DocumentType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface DocumentTemplate {
  id: string;
  companyId: string;
  typeId: string;
  name: string;
  description: string;
  htmlContent: string;
  variables: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor() {
    this.loadCustomData();
  }

  private loadCustomData() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedFolders = localStorage.getItem('hr_custom_folders');
      if (storedFolders) {
        try {
          const parsed = JSON.parse(storedFolders) as CompanyFolder[];
          this.folders.set([...this.folders(), ...parsed]);
        } catch (e) {
          console.error('Error loading custom folders', e);
        }
      }

      const storedTemplates = localStorage.getItem('hr_custom_templates');
      if (storedTemplates) {
        try {
          const parsed = JSON.parse(storedTemplates) as DocumentTemplate[];
          this.templates.set([...this.templates(), ...parsed]);
        } catch (e) {
          console.error('Error loading custom templates', e);
        }
      }
    }
  }

  // Static Company Folders
  public readonly folders = signal<CompanyFolder[]>([
    {
      id: 'tvm',
      name: 'TVM Infotech',
      logo: 'fa-building-columns',
      description: 'Standard IT consulting and development templates',
      color: '#5974a3'
    },
    {
      id: 'asminds',
      name: 'Asminds Group',
      logo: 'fa-globe',
      description: 'Vibrant staffing and product engineering templates',
      color: '#57a6b0'
    },
    {
      id: 'jnj',
      name: 'J&J Corporation',
      logo: 'fa-shield-halved',
      description: 'Corporate enterprises and services templates',
      color: '#84c0d8'
    }
  ]);

  public readonly documentTypes = signal<DocumentType[]>([
    { id: 'offer', name: 'Offer Letter', icon: 'fa-file-signature', description: 'Employment offers' },
    { id: 'relieving', name: 'Relieving Letter', icon: 'fa-file-invoice', description: 'Separation letters' },
    { id: 'service', name: 'Service Letter', icon: 'fa-file-shield', description: 'Work experience certificates' },
    { id: 'payslip', name: 'Payslip', icon: 'fa-receipt', description: 'Monthly salary breakdowns' }
  ]);

  public readonly selectedFolderId = signal<string | null>(null);
  public readonly selectedTypeId = signal<string | null>(null);
  public readonly selectedTemplateId = signal<string | null>(null);

  public readonly activeTemplateName = signal<string>('Untitled Document');
  public readonly activeHtml = signal<string>('');
  public readonly activeVariables = signal<Record<string, string>>({});
  public readonly isUploadedDocument = signal<boolean>(false);

  public readonly selectedFolder = computed(() => {
    const id = this.selectedFolderId();
    return id ? this.folders().find(f => f.id === id) || null : null;
  });

  public readonly selectedType = computed(() => {
    const id = this.selectedTypeId();
    return id ? this.documentTypes().find(t => t.id === id) || null : null;
  });

  public readonly templates = signal<DocumentTemplate[]>([
    {
      id: 'tvm-offer',
      companyId: 'tvm',
      typeId: 'offer',
      name: 'TVM Executive Offer Letter',
      description: 'Standard employment offer letter for technical positions at TVM Infotech.',
      variables: {
        companyName: 'TVM Infotech Private Limited',
        companyAddress: 'No: 189, 1st Floor, Kamakoti Nagar 1st Main road, 7th St, Pallikaranai, Chennai, Tamil Nadu 600100, India',
        employeeName: 'Ashish Kumar Yadav',
        designation: 'Software Engineer',
        joiningDate: '2026-07-15',
        salary: '12,00,000',
        reportingManager: 'Venkatesh R',
        probationPeriod: '6 Months'
      },
      htmlContent: `
        <div style="font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff;">
          <!-- Header -->
          <table style="width: 100%; border: none; border-collapse: collapse; border-bottom: 2px solid #5974a3; margin-bottom: 30px;">
            <tr>
              <td style="border: none; padding: 0 0 20px 0; text-align: left; vertical-align: middle;">
                <h2 style="color: #5974a3; margin: 0; font-size: 26px; font-weight: 700;">{{companyName}}</h2>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #718096;">{{companyAddress}}</p>
              </td>
              <td style="border: none; padding: 0 0 20px 0; text-align: right; vertical-align: middle;">
                <span style="font-size: 14px; font-weight: 600; color: #57a6b0; border: 1px solid #57a6b0; padding: 4px 10px; border-radius: 4px; display: inline-block;">PRIVATE & CONFIDENTIAL</span>
              </td>
            </tr>
          </table>

          <!-- Title -->
          <h3 style="text-align: center; color: #2e353e; font-size: 20px; text-transform: uppercase; margin-bottom: 30px; font-weight: 700; letter-spacing: 0.5px;">Letter of Intent and Offer</h3>

          <!-- Meta -->
          <div style="margin-bottom: 25px;">
            <p style="margin: 0; font-weight: 600;">Date: <span class="doc-var" data-var="currentDate">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            <p style="margin: 5px 0 0 0; font-weight: 600;">To,</p>
            <p style="margin: 5px 0 0 0; font-size: 15px; font-weight: 700; color: #5974a3;">{{employeeName}}</p>
            <p style="margin: 2px 0 0 0; font-size: 14px; color: #718096;">Candidate Address Block, Chennai</p>
          </div>

          <!-- Body -->
          <p>Dear <strong>{{employeeName}}</strong>,</p>
          <p>With reference to your interview and subsequent discussions we had with you, we are pleased to offer you employment with <strong>{{companyName}}</strong> as a <strong>{{designation}}</strong>.</p>

          <p>Your joining date is scheduled to be <strong>{{joiningDate}}</strong>. You will report to <strong>{{reportingManager}}</strong> at our Chennai office. Your annual Gross Compensation (CTC) will be <strong>INR {{salary}}/- per annum</strong>, as detailed in the attached annexures.</p>

          <p>Your employment will be subject to the following terms and conditions:</p>
          <ol style="margin-left: 20px; margin-bottom: 20px; padding-left: 10px;">
            <li style="margin-bottom: 8px;"><strong>Probation:</strong> You will be on a probation period of <strong>{{probationPeriod}}</strong> from the date of joining, which may be extended at the discretion of the management.</li>
            <li style="margin-bottom: 8px;"><strong>Confidentiality:</strong> You shall not disclose or leak any proprietary codebase or client business logic to any third party during or after your tenure.</li>
            <li style="margin-bottom: 8px;"><strong>Notice Period:</strong> Either party may terminate this employment by giving 60 days of written notice or salary in lieu thereof.</li>
          </ol>

          <p>Please sign and return the duplicate copy of this letter as a token of your acceptance of this offer and the terms mentioned herein.</p>

          <p style="margin-top: 40px;">Welcome aboard!</p>

          <!-- Signatures -->
          <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 50px;">
            <tr>
              <td style="width: 50%; border: none; padding: 0; vertical-align: top; text-align: left;">
                <p style="margin-bottom: 40px; color: #718096;">For <strong>{{companyName}}</strong></p>
                <p style="margin: 0; font-weight: 700;">HR Operations Team</p>
                <p style="margin: 0; font-size: 12px; color: #a0aec0;">Authorized Signatory</p>
              </td>
              <td style="width: 50%; border: none; padding: 0; vertical-align: top; text-align: right;">
                <p style="margin-bottom: 40px; color: #718096;">Accepted By</p>
                <p style="margin: 0; border-top: 1px dashed #a0aec0; width: 180px; display: inline-block; padding-top: 5px;"></p>
                <p style="margin: 0; font-size: 12px; color: #a0aec0;">{{employeeName}} (Signature & Date)</p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      id: 'tvm-relieving',
      companyId: 'tvm',
      typeId: 'relieving',
      name: 'TVM Standard Relieving Letter',
      description: 'Relieving confirmation letter with performance remarks.',
      variables: {
        companyName: 'TVM Infotech Private Limited',
        companyAddress: 'No: 189, 1st Floor, Kamakoti Nagar 1st Main road, 7th St, Pallikaranai, Chennai, Tamil Nadu 600100, India',
        employeeName: 'Ashish Kumar Yadav',
        designation: 'Software Engineer',
        joiningDate: '2023-01-10',
        relievingDate: '2026-06-30',
        empId: 'TVM-8492'
      },
      htmlContent: `
        <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff;">
          <div style="border-bottom: 2px solid #5974a3; padding-bottom: 15px; margin-bottom: 30px;">
            <h2 style="color: #5974a3; margin: 0; font-size: 24px; font-weight: 700;">{{companyName}}</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #718096;">{{companyAddress}}</p>
          </div>

          <h3 style="text-align: center; color: #2e353e; font-size: 18px; text-transform: uppercase; margin-bottom: 35px; font-weight: 700;">RELIEVING ORDER & SERVICE CERTIFICATE</h3>

          <p>Date: <span class="doc-var" data-var="currentDate">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>

          <p><strong>To Whomsoever It May Concern</strong></p>

          <p>This is to certify and confirm that <strong>{{employeeName}}</strong> (Employee ID: <strong>{{empId}}</strong>) was employed with <strong>{{companyName}}</strong> as a <strong>{{designation}}</strong> from <strong>{{joiningDate}}</strong> to <strong>{{relievingDate}}</strong>.</p>

          <p>He has resigned from the services of the Company of his own accord, and his resignation was accepted by the management. Consequently, he has been relieved of all responsibilities and duties in the company with effect from the close of business hours on <strong>{{relievingDate}}</strong>.</p>

          <p>During his tenure with us, we found him to be dedicated, hard-working, and highly professional in his work. He has completed all handovers of company assets and repositories, and his full-and-final settlement has been cleared.</p>

          <p>We wish him all success in his future endeavors.</p>

          <div style="margin-top: 80px;">
            <p style="margin: 0; font-weight: 700; color: #5974a3;">For {{companyName}}</p>
            <p style="margin: 40px 0 0 0; font-weight: 600;">Human Resources Department</p>
            <p style="margin: 0; font-size: 12px; color: #a0aec0;">TVM Infotech Operations</p>
          </div>
        </div>
      `
    },
    {
      id: 'tvm-service',
      companyId: 'tvm',
      typeId: 'service',
      name: 'TVM Work Experience Certificate',
      description: 'Standard work experience letter confirming roles and responsibilities.',
      variables: {
        companyName: 'TVM Infotech Private Limited',
        companyAddress: 'No: 189, 1st Floor, Kamakoti Nagar 1st Main road, 7th St, Pallikaranai, Chennai, Tamil Nadu 600100, India',
        employeeName: 'Ashish Kumar Yadav',
        designation: 'Software Engineer',
        joiningDate: '2023-01-10',
        relievingDate: '2026-06-30'
      },
      htmlContent: `
        <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff; border: 1px solid #e1e5eb;">
          <div style="border-bottom: 2px solid #5974a3; padding-bottom: 15px; margin-bottom: 30px; text-align: center;">
            <h2 style="color: #5974a3; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;">{{companyName}}</h2>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #718096; letter-spacing: 0.5px;">{{companyAddress}}</p>
          </div>

          <h3 style="text-align: center; color: #57a6b0; font-size: 20px; font-weight: 700; margin-bottom: 40px; text-transform: uppercase;">EXPERIENCE CERTIFICATE</h3>

          <p style="text-align: right; font-size: 14px;">Date: <strong>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>

          <p style="font-size: 16px; margin-top: 20px;"><strong>TO WHOMSOEVER IT MAY CONCERN</strong></p>

          <p style="font-size: 15px; text-align: justify; margin-top: 15px;">
            This is to certify that <strong>{{employeeName}}</strong> has worked in <strong>{{companyName}}</strong> in the position of <strong>{{designation}}</strong> from <strong>{{joiningDate}}</strong> to <strong>{{relievingDate}}</strong>.
          </p>

          <p style="font-size: 15px; text-align: justify;">
            During this period, his duties included developing robust scalable web applications in Angular, implementing premium UI mockups, and collaborating with cross-functional product development teams. He has shown deep technical expertise and strong analytical capabilities.
          </p>

          <p style="font-size: 15px; text-align: justify;">
            He is a quick learner with excellent teamwork qualities. He bears a clean moral character, and we found him to be honest, sincere, and hardworking.
          </p>

          <p style="font-size: 15px;">We wish him the absolute best for all his future career milestones.</p>

          <div style="margin-top: 80px; display: flex; justify-content: space-between;">
            <div>
              <p style="margin: 0; font-weight: 700; color: #5974a3;">For {{companyName}}</p>
              <p style="margin: 50px 0 0 0; font-weight: 600;">Authorized Officer</p>
              <p style="margin: 0; font-size: 12px; color: #a0aec0;">Human Resources Division</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'tvm-payslip',
      companyId: 'tvm',
      typeId: 'payslip',
      name: 'TVM Salary Payslip Template',
      description: 'Recalculating monthly payslip with earnings, deductions, and net pay.',
      variables: {
        companyName: 'TVM Infotech Private Limited',
        employeeName: 'Ashish Kumar Yadav',
        joiningDate: '19-02-2024',
        empId: '5720444',
        location: 'Chennai',
        designation: 'Software Engineer',
        nwd: '31',
        panNo: '',
        lopDays: '0',
        dob: '',
        bankAcc: '',
        uan: '',
        pfNo: '',
        monthYear: 'March 2026',
        basic: '0.00',
        hra: '0.00',
        medical: '0.00',
        conveyance: '0.00',
        flexi: '0.00',
        lta: '0.00',
        special: '0.00',
        pt: '0.00',
        incomeTax: '0.00',
        leaveDeductions: '0.00',
        otherDeductions: '0.00',
        pf: '0.00',
        variablePay: '0.00'
      },
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; padding: 0; background: transparent; max-width: 100%; width: 100%; box-sizing: border-box;">

          <!-- Logo & Title Header -->
          <div style="text-align: center; margin-bottom: 15px; font-family: Arial, sans-serif;">
            <div style="font-size: 44px; font-weight: 900; color: #0f4c81; letter-spacing: -1.5px; line-height: 1.1; margin: 0 auto 2px auto; font-family: 'Arial Black', Impact, sans-serif;">TVM</div>
            <div style="font-size: 16px; color: #0f4c81; font-style: italic; font-weight: bold; margin-bottom: 10px;">let's Begin</div>
            <div style="font-size: 15px; font-weight: 700; border-bottom: 1.5px solid #1e293b; display: inline-block; padding-bottom: 2px; color: #1e293b; letter-spacing: 0.3px;">Pay Slip For The Month of {{monthYear}}</div>
          </div>

          <!-- Employee Info Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12.5px;">
            <tr style="background-color: #2e4fa3; height: 7px;">
              <td colspan="4" style="padding: 0; border: none;"></td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; width: 22%; background-color: #f1f5f9;">Employee Name</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; width: 28%; background-color: #ffffff;">{{employeeName}}</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; width: 22%; background-color: #f1f5f9;">Joining Date</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; width: 28%; background-color: #ffffff;">{{joiningDate}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">Employee Id</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{empId}}</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">Location</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{location}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">Designation</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{designation}}</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">NWD</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{nwd}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">PAN No</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{panNo}}</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">LOP Day(s)</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{lopDays}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">DOB</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{dob}}</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">Bank Account</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{bankAcc}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">UAN</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{uan}}</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700; background-color: #f1f5f9;">PF</td>
              <td style="padding: 8px 10px; border: 1px solid #b8c4d8; background-color: #ffffff;">{{pfNo}}</td>
            </tr>
          </table>

          <!-- Earnings & Deductions Table -->
          <table id="payslip-breakdown-table" style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12.5px; border: 1px solid #b8c4d8;">
            <!-- Section header row -->
            <thead>
              <tr style="background-color: #2e4fa3; color: #ffffff; text-align: center;">
                <th colspan="2" style="padding: 9px 10px; border: 1px solid #3d5bb0; font-weight: 700; font-size: 13px; width: 50%;">Earnings</th>
                <th colspan="2" style="padding: 9px 10px; border: 1px solid #3d5bb0; font-weight: 700; font-size: 13px; width: 50%;">Deductions</th>
              </tr>
              <!-- Sub-header row -->
              <tr style="background-color: #ffffff; color: #1e293b; text-align: center; font-weight: 700;">
                <th style="padding: 7px 10px; border: 1px solid #b8c4d8; width: 30%; text-align: left;">Particulars</th>
                <th style="padding: 7px 10px; border: 1px solid #b8c4d8; width: 20%; text-align: right;">Amount (&#8377;)</th>
                <th style="padding: 7px 10px; border: 1px solid #b8c4d8; width: 30%; text-align: left;">Particulars</th>
                <th style="padding: 7px 10px; border: 1px solid #b8c4d8; width: 20%; text-align: right;">Amount (&#8377;)</th>
              </tr>
            </thead>
            <tbody id="payslip-table-body">
              <!-- Row 1 -->
              <tr>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Basic Salary</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-earning" id="val-basic">{{basic}}</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Professional Tax</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-deduction" id="val-pt">{{pt}}</td>
              </tr>
              <!-- Row 2 -->
              <tr>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">House Rent Allowance</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-earning" id="val-hra">{{hra}}</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Income Tax</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-deduction" id="val-incomeTax">{{incomeTax}}</td>
              </tr>
              <!-- Row 3 -->
              <tr>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Medical Allowance</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-earning" id="val-medical">{{medical}}</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Leave Deductions</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-deduction" id="val-leaveDeductions">{{leaveDeductions}}</td>
              </tr>
              <!-- Row 4 -->
              <tr>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Conveyance Allowance</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-earning" id="val-conveyance">{{conveyance}}</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Other Deductions</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-deduction" id="val-otherDeductions">{{otherDeductions}}</td>
              </tr>
              <!-- Row 5 -->
              <tr>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Flexi Benefit Plan</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-earning" id="val-flexi">{{flexi}}</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">PF / ESI Deductions</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-deduction" id="val-pf">{{pf}}</td>
              </tr>
              <!-- Row 6 -->
              <tr>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Leave Travel Allowance</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-earning" id="val-lta">{{lta}}</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Variable Pay</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-deduction" id="val-variablePay">{{variablePay}}</td>
              </tr>
              <!-- Row 7: Special Allowance — deduction side blank -->
              <tr>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">Special Allowance</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8; text-align: right;" class="val-earning" id="val-special">{{special}}</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">&nbsp;</td>
                <td style="padding: 7px 10px; border: 1px solid #b8c4d8;">&nbsp;</td>
              </tr>
              <!-- Total Row -->
              <tr id="payslip-total-row" style="background-color: #f0f4fb; font-weight: 700;">
                <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700;">Total</td>
                <td style="padding: 8px 10px; border: 1px solid #b8c4d8; text-align: right; font-weight: 700;" id="val-totalEarnings">0.00</td>
                <td style="padding: 8px 10px; border: 1px solid #b8c4d8; font-weight: 700;">Total</td>
                <td style="padding: 8px 10px; border: 1px solid #b8c4d8; text-align: right; font-weight: 700;" id="val-totalDeductions">0.00</td>
              </tr>
            </tbody>
          </table>

          <!-- Net Salary Box -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; border: 1.5px solid #b8c4d8; background-color: #eef2fb;">
            <tr>
              <td style="padding: 10px 12px; font-weight: 700; width: 75%; color: #1e293b;">Net Salary:-</td>
              <td style="padding: 10px 12px; font-weight: 700; text-align: right; color: #1e293b;" id="val-netSalary">0.00</td>
            </tr>
          </table>

          <!-- Disclaimer -->
          <p style="text-align: center; font-size: 11.5px; color: #475569; font-style: italic; margin: 15px 0 0 0;">(This is a system generated statement and requires no signature)</p>

          <!-- Company Footer -->
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #334155; line-height: 1.6;">
            <div style="font-weight: 800; color: #2b4fa3; font-size: 13px; margin-bottom: 3px;">TVM Infotech Private Limited</div>
            <div>No: 189, 1st Floor, Kamakoti Nagar 1st Main road,</div>
            <div>7th St, Pallikaranai, Chennai, Tamil Nadu 600100, India</div>
            <div>+91 9710112080, +91 9150871694</div>
            <div>www.tvminfotech.com</div>
          </div>

        </div>
      `
    },

    {
      id: 'asminds-offer',
      companyId: 'asminds',
      typeId: 'offer',
      name: 'Asminds Standard Offer Letter',
      description: 'Employment offer letter for development and recruiting divisions at Asminds.',
      variables: {
        companyName: 'Asminds Group of Companies',
        companyAddress: 'Module 1A, Block II, IITM Research Park, Kanagam Road, Taramani - 600113',
        employeeName: 'Ashish Kumar Yadav',
        designation: 'Staff Product Engineer',
        joiningDate: '2026-08-01',
        salary: '15,50,000',
        reportingManager: 'Ashish Kumar S',
        probationPeriod: '3 Months'
      },
      htmlContent: `
        <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff; border-top: 8px solid #57a6b0;">
          <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 30px;">
            <tr>
              <td style="border: none; padding: 0; text-align: left; vertical-align: middle;">
                <h2 style="color: #57a6b0; margin: 0; font-size: 26px; font-weight: 800;">{{companyName}}</h2>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #718096; max-width: 320px;">{{companyAddress}}</p>
              </td>
              <td style="border: none; padding: 0; text-align: right; vertical-align: middle;">
                <span style="font-size: 12px; background: #eef7f8; color: #57a6b0; padding: 6px 12px; border-radius: 20px; font-weight: 700; display: inline-block;">ASMINDS HR NETWORK</span>
              </td>
            </tr>
          </table>

          <h3 style="text-align: center; color: #2e353e; font-size: 20px; text-transform: uppercase; margin-bottom: 30px; font-weight: 700;">EMPLOYMENT OFFER LETTER</h3>

          <p>Date: <span class="doc-var" data-var="currentDate">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>

          <p>Dear <strong>{{employeeName}}</strong>,</p>
          <p>We are delighted to extend an offer of employment to you for the position of <strong>{{designation}}</strong> at <strong>{{companyName}}</strong>.</p>

          <p>Your joining date will be <strong>{{joiningDate}}</strong>. You will report to <strong>{{reportingManager}}</strong>. Your gross CTC will be <strong>INR {{salary}}/- per annum</strong>. Your probation period will be <strong>{{probationPeriod}}</strong>.</p>

          <p>You will be bound by the company policies and ethical guidelines. We are confident your skills will contribute immensely to our product group.</p>

          <p>Kindly sign the copy of this offer letter as a confirmation of acceptance.</p>

          <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 60px;">
            <tr>
              <td style="width: 50%; border: none; padding: 0; vertical-align: top; text-align: left;">
                <p style="margin-bottom: 40px; color: #718096;">For <strong>{{companyName}}</strong></p>
                <p style="margin: 0; font-weight: 700; color: #57a6b0;">Management Representative</p>
              </td>
              <td style="width: 50%; border: none; padding: 0; vertical-align: top; text-align: right;">
                <p style="margin-bottom: 40px; color: #718096;">Candidate Signature</p>
                <p style="margin: 0; border-top: 1px solid #e1e5eb; width: 180px; display: inline-block; padding-top: 5px;"></p>
              </td>
            </tr>
          </table>
        </div>
      `
    },
    {
      id: 'asminds-relieving',
      companyId: 'asminds',
      typeId: 'relieving',
      name: 'Asminds Relieving Letter',
      description: 'Employee relieving letter with experience record.',
      variables: {
        companyName: 'Asminds Group of Companies',
        companyAddress: 'IITM Research Park, Taramani - 600113',
        employeeName: 'Ashish Kumar Yadav',
        designation: 'Staff Product Engineer',
        joiningDate: '2024-02-15',
        relievingDate: '2026-06-30'
      },
      htmlContent: `
        <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff; border-top: 8px solid #57a6b0;">
          <h2 style="color: #57a6b0; text-align: center; margin: 0 0 20px 0; font-weight: 800;">{{companyName}}</h2>
          <hr style="border: 0; border-top: 1px solid #e1e5eb; margin-bottom: 30px;" />
          <h3 style="text-align: center; font-weight: 700; margin-bottom: 30px;">RELIEVING CERTIFICATE</h3>
          <p>Dear {{employeeName}},</p>
          <p>We hereby confirm that you have been relieved from your duties as a <strong>{{designation}}</strong> in our company with effect from <strong>{{relievingDate}}</strong>.</p>
          <p>You served the company from <strong>{{joiningDate}}</strong> to <strong>{{relievingDate}}</strong>. Your accounts and clearances have been completely settled.</p>
          <p>We appreciate your services and wish you a bright career ahead.</p>
          <p style="margin-top: 60px;">Sincerely,<br/><strong>Asminds HR Team</strong></p>
        </div>
      `
    },
    {
      id: 'asminds-service',
      companyId: 'asminds',
      typeId: 'service',
      name: 'Asminds Service Certificate',
      description: 'Experience letter confirming engineering contributions.',
      variables: {
        companyName: 'Asminds Group of Companies',
        companyAddress: 'IITM Research Park, Taramani - 600113',
        employeeName: 'Ashish Kumar Yadav',
        designation: 'Staff Product Engineer',
        joiningDate: '2024-02-15',
        relievingDate: '2026-06-30'
      },
      htmlContent: `
        <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff; border-top: 8px solid #57a6b0;">
          <h2 style="color: #57a6b0; text-align: center; margin: 0 0 20px 0; font-weight: 800;">{{companyName}}</h2>
          <hr style="border: 0; border-top: 1px solid #e1e5eb; margin-bottom: 30px;" />
          <h3 style="text-align: center; font-weight: 700; margin-bottom: 30px; color: #2e353e;">TO WHOMSOEVER IT MAY CONCERN</h3>
          <p>This is to certify that <strong>{{employeeName}}</strong> served as a <strong>{{designation}}</strong> with <strong>{{companyName}}</strong> from <strong>{{joiningDate}}</strong> to <strong>{{relievingDate}}</strong>.</p>
          <p>He performed his roles and responsibilities with outstanding diligence and professionalism. We wish him all the best in his future endeavors.</p>
          <p style="margin-top: 60px;">For <strong>Asminds Group</strong>,<br/>Human Resources Department</p>
        </div>
      `
    },
    {
      id: 'asminds-payslip',
      companyId: 'asminds',
      typeId: 'payslip',
      name: 'Asminds Monthly Payslip',
      description: 'Asminds salary payslip breakdown.',
      variables: {
        companyName: 'Asminds Group of Companies',
        companyAddress: 'IITM Research Park, Taramani - 600113',
        employeeName: 'Ashish Kumar Yadav',
        designation: 'Staff Product Engineer',
        monthYear: 'June 2026',
        empId: 'ASM-1893',
        bankName: 'HDFC Bank',
        bankAcc: '************4819',
        daysWorked: '30',
        basic: '55000',
        hra: '22000',
        conveyance: '2000',
        special: '18000',
        pf: '1800',
        pt: '200',
        tax: '6500'
      },
      htmlContent: `
        <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 30px; background: #fff; border-top: 6px solid #57a6b0;">
          <h2 style="color: #57a6b0; margin: 0; text-align: center;">{{companyName}}</h2>
          <h4 style="margin: 5px 0 15px 0; text-align: center; color: #718096; text-transform: uppercase;">Payslip - {{monthYear}}</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <tr><td><strong>Emp ID:</strong> {{empId}}</td><td><strong>Employee Name:</strong> {{employeeName}}</td></tr>
            <tr><td><strong>Designation:</strong> {{designation}}</td><td><strong>Bank Account:</strong> {{bankAcc}}</td></tr>
          </table>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e1e5eb; font-size: 13px;">
            <tr style="background: #57a6b0; color: white;"><th>Earnings</th><th>INR</th><th>Deductions</th><th>INR</th></tr>
            <tr><td>Basic</td><td id="val-basic">{{basic}}</td><td>PF</td><td id="val-pf">{{pf}}</td></tr>
            <tr><td>HRA</td><td id="val-hra">{{hra}}</td><td>PT</td><td id="val-pt">{{pt}}</td></tr>
            <tr><td>Conveyance</td><td id="val-conveyance">{{conveyance}}</td><td>TDS</td><td id="val-tax">{{tax}}</td></tr>
            <tr><td>Special Allow.</td><td id="val-special">{{special}}</td><td>-</td><td>0</td></tr>
            <tr style="font-weight: 700; background: #f7fafc;">
              <td>Total Earnings</td><td id="val-totalEarnings">97000</td>
              <td>Total Deductions</td><td id="val-totalDeductions">8500</td>
            </tr>
          </table>
          <div style="margin-top: 15px; padding: 10px; background: #eef7f8; border: 1px solid #57a6b0; text-align: center; border-radius: 4px;">
            <strong>Net Pay: </strong><span id="val-netSalary">INR 88,500/-</span> (<span id="val-netSalaryWords" style="font-style: italic;">Eighty Eight Thousand Five Hundred Only</span>)
          </div>
        </div>
      `
    }
  ]);

  public readonly searchQuery = signal<string>('');

  public readonly filteredTemplates = computed(() => {
    const fId = this.selectedFolderId();
    const tId = this.selectedTypeId();
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      return this.templates().filter(t => {
        const matchesQuery = t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query);
        if (fId && tId) {
          return t.companyId === fId && t.typeId === tId && matchesQuery;
        }
        return matchesQuery;
      });
    }

    if (!fId || !tId) return [];
    return this.templates().filter(t => t.companyId === fId && t.typeId === tId);
  });

  public selectFolder(folderId: string | null) {
    this.selectedFolderId.set(folderId);
    this.selectedTypeId.set(null);
    this.selectedTemplateId.set(null);
  }

  public selectType(typeId: string | null) {
    this.selectedTypeId.set(typeId);
    this.selectedTemplateId.set(null);
  }

  // Action: Select template and load it as active
  public loadTemplate(templateId: string) {
    const template = this.templates().find(t => t.id === templateId);
    if (template) {
      this.selectedTemplateId.set(templateId);
      this.activeTemplateName.set(template.name);
      this.activeHtml.set(template.htmlContent);
      this.activeVariables.set({ ...template.variables });
      this.isUploadedDocument.set(false);

      this.addActivity(`${template.name} opened in editor`, 'fa-file-signature', 'offer');
    }
  }

  public updateVariable(key: string, value: string) {
    const vars = this.activeVariables();
    vars[key] = value;
    this.activeVariables.set({ ...vars });
  }

  public loadUploadedDocument(name: string, html: string, detectedVariables: Record<string, string>) {
    this.selectedFolderId.set(null);
    this.selectedTypeId.set(null);
    this.selectedTemplateId.set(null);

    this.activeTemplateName.set(name);
    this.activeHtml.set(html);
    this.activeVariables.set(detectedVariables);
    this.isUploadedDocument.set(true);

    this.addActivity(`Uploaded ${name} to Editor`, 'fa-cloud-arrow-up', 'upload');
  }

  public readonly downloadCount = signal<number>(this.loadStoredStat('hr_total_downloads', 0));
  public readonly editCount = signal<number>(this.loadStoredStat('hr_recent_edits', 0));

  // public incrementDownloads() {
  //   const val = this.downloadCount() + 1;
  //   this.downloadCount.set(val);
  //   this.saveStoredStat('hr_total_downloads', val);

  //   // Log activity
  //   const docName = this.activeTemplateName() || 'Document';
  //   this.addActivity(`${docName} downloaded`, 'fa-download', 'download');
  // }

  incrementDownloads() {
    const val = this.downloadCount() + 1;

    this.downloadCount.set(val);

    this.saveStoredStat('hr_total_downloads', val);
}

  public incrementEdits() {
    const val = this.editCount() + 1;
    this.editCount.set(val);
    this.saveStoredStat('hr_recent_edits', val);
  }

  private loadStoredStat(key: string, def: number): number {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : def;
    }
    return def;
  }

  private saveStoredStat(key: string, val: number) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, val.toString());
    }
  }

  public clearActivityLog() {
    this.activityLog.set([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('hr_activity_log');
    }
  }

  public readonly activityLog = signal<{ text: string; icon: string; type: string; timestamp: number }[]>(
    this.loadActivityLog()
  );

  /** Add a new activity entry, keep max 20, persist to localStorage */
  public addActivity(text: string, icon: string, type: string) {
    const entry = { text, icon, type, timestamp: Date.now() };
    const updated = [entry, ...this.activityLog()].slice(0, 20);
    this.activityLog.set(updated);
    this.saveActivityLog(updated);
  }

  public getRelativeTime(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  }

  private loadActivityLog(): { text: string; icon: string; type: string; timestamp: number }[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('hr_activity_log');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {  }
      }
    }
    return [];
  }

  private saveActivityLog(log: { text: string; icon: string; type: string; timestamp: number }[]) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('hr_activity_log', JSON.stringify(log));
    }
  }

  public addCompany(name: string, description: string, color: string) {
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newFolder: CompanyFolder = {
      id,
      name,
      logo: 'fa-building',
      description: description || `Custom templates folder for ${name}.`,
      color: color || '#2563eb'
    };

    const defaultTemplates: DocumentTemplate[] = [
      {
        id: `${id}-offer`,
        companyId: id,
        typeId: 'offer',
        name: `${name} Standard Offer Letter`,
        description: `Offer of employment for ${name}.`,
        variables: {
          companyName: name,
          companyAddress: 'Corporate HQ Address Block',
          employeeName: 'Ashish Kumar Yadav',
          designation: 'Software Engineer',
          joiningDate: new Date().toISOString().substring(0, 10),
          salary: '6,00,000',
          reportingManager: 'Operations Lead',
          probationPeriod: '6 Months'
        },
        htmlContent: `
          <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff;">
            <h2 style="color: ${color || '#2563eb'}; text-align: center;">{{companyName}}</h2>
            <p style="text-align: center; color: #718096; font-size: 13px;">{{companyAddress}}</p>
            <h3 style="text-align: center; margin-top: 30px; font-weight: 700;">OFFER OF EMPLOYMENT</h3>
            <p>Dear <strong>{{employeeName}}</strong>,</p>
            <p>We are pleased to offer you employment with <strong>{{companyName}}</strong> as a <strong>{{designation}}</strong>.</p>
            <p>Your joining date is <strong>{{joiningDate}}</strong>, reporting to <strong>{{reportingManager}}</strong>. Your annual compensation will be <strong>INR {{salary}}/- per annum</strong>.</p>
            <p>Your employment will be subject to a probation period of <strong>{{probationPeriod}}</strong>.</p>
            <p>Welcome aboard!</p>
          </div>
        `
      },
      {
        id: `${id}-relieving`,
        companyId: id,
        typeId: 'relieving',
        name: `${name} Relieving Letter`,
        description: `Relieving letter for departing employee of ${name}.`,
        variables: {
          companyName: name,
          companyAddress: 'Corporate HQ Address Block',
          employeeName: 'Ashish Kumar Yadav',
          designation: 'Software Engineer',
          joiningDate: '2024-01-10',
          relievingDate: new Date().toISOString().substring(0, 10),
          empId: 'EMP-001'
        },
        htmlContent: `
          <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff;">
            <h2 style="color: ${color || '#2563eb'}; text-align: center;">{{companyName}}</h2>
            <p style="text-align: center; color: #718096; font-size: 13px;">{{companyAddress}}</p>
            <h3 style="text-align: center; margin-top: 30px; font-weight: 700;">RELIEVING ORDER & EXPERIENCE CERTIFICATE</h3>
            <p>This is to certify that <strong>{{employeeName}}</strong> (Employee ID: <strong>{{empId}}</strong>) was employed with <strong>{{companyName}}</strong> as a <strong>{{designation}}</strong> from <strong>{{joiningDate}}</strong> to <strong>{{relievingDate}}</strong>.</p>
            <p>He/She is relieved of all active duties and responsibilities with effect from <strong>{{relievingDate}}</strong>. We wish them success in their future career.</p>
          </div>
        `
      },
      {
        id: `${id}-service`,
        companyId: id,
        typeId: 'service',
        name: `${name} Service Certificate`,
        description: `Work experience certificate for ${name}.`,
        variables: {
          companyName: name,
          companyAddress: 'Corporate HQ Address Block',
          employeeName: 'Ashish Kumar Yadav',
          designation: 'Software Engineer',
          joiningDate: '2024-01-10',
          relievingDate: new Date().toISOString().substring(0, 10)
        },
        htmlContent: `
          <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 40px; line-height: 1.6; background: #fff;">
            <h2 style="color: ${color || '#2563eb'}; text-align: center;">{{companyName}}</h2>
            <p style="text-align: center; color: #718096; font-size: 13px;">{{companyAddress}}</p>
            <h3 style="text-align: center; margin-top: 30px; font-weight: 700;">SERVICE EXPERIENCE CERTIFICATE</h3>
            <p>This is to certify that <strong>{{employeeName}}</strong> has served in <strong>{{companyName}}</strong> as a <strong>{{designation}}</strong> from <strong>{{joiningDate}}</strong> to <strong>{{relievingDate}}</strong>.</p>
            <p>His/Her conduct during the employment was exemplary. We wish them all the best.</p>
          </div>
        `
      },
      {
        id: `${id}-payslip`,
        companyId: id,
        typeId: 'payslip',
        name: `${name} Payslip Template`,
        description: `Monthly salary payslip for ${name}.`,
        variables: {
          companyName: name,
          monthYear: 'June 2026',
          empId: 'EMP-001',
          employeeName: 'Ashish Kumar Yadav',
          designation: 'Software Engineer',
          bankAcc: 'XXXX-XXXX-XXXX-1234',
          basic: '40000',
          hra: '16000',
          conveyance: '2000',
          special: '10000',
          pf: '1800',
          pt: '200',
          tax: '1500'
        },
        htmlContent: `
          <div style="font-family: 'Outfit', Arial, sans-serif; color: #2e353e; padding: 30px; background: #fff; border-top: 6px solid ${color || '#2563eb'};">
            <h2 style="color: ${color || '#2563eb'}; margin: 0; text-align: center;">{{companyName}}</h2>
            <h4 style="margin: 5px 0 15px 0; text-align: center; color: #718096; text-transform: uppercase;">Payslip - {{monthYear}}</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
              <tr><td><strong>Emp ID:</strong> {{empId}}</td><td><strong>Employee Name:</strong> {{employeeName}}</td></tr>
              <tr><td><strong>Designation:</strong> {{designation}}</td><td><strong>Bank Account:</strong> {{bankAcc}}</td></tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e1e5eb; font-size: 13px;">
              <tr style="background: ${color || '#2563eb'}; color: white;"><th>Earnings</th><th>INR</th><th>Deductions</th><th>INR</th></tr>
              <tr><td>Basic</td><td id="val-basic">{{basic}}</td><td>PF</td><td id="val-pf">{{pf}}</td></tr>
              <tr><td>HRA</td><td id="val-hra">{{hra}}</td><td>PT</td><td id="val-pt">{{pt}}</td></tr>
              <tr><td>Conveyance</td><td id="val-conveyance">{{conveyance}}</td><td>TDS</td><td id="val-tax">{{tax}}</td></tr>
              <tr><td>Special Allow.</td><td id="val-special">{{special}}</td><td>-</td><td>0</td></tr>
              <tr style="font-weight: 700; background: #f7fafc;">
                <td>Total Earnings</td><td id="val-totalEarnings">68000</td>
                <td>Total Deductions</td><td id="val-totalDeductions">3500</td>
              </tr>
            </table>
            <div style="margin-top: 15px; padding: 10px; background: #f0f4f8; border: 1px solid #e1e5eb; text-align: center; border-radius: 4px;">
              <strong>Net Pay: </strong><span id="val-netSalary">INR 64,500/-</span> (<span id="val-netSalaryWords" style="font-style: italic;">Sixty Four Thousand Five Hundred Only</span>)
            </div>
          </div>
        `
      }
    ];

    const updatedFolders = [...this.folders(), newFolder];
    this.folders.set(updatedFolders);

    const updatedTemplates = [...this.templates(), ...defaultTemplates];
    this.templates.set(updatedTemplates);

    if (typeof window !== 'undefined' && window.localStorage) {
      const customFolders = updatedFolders.filter(f => !['tvm', 'asminds', 'jnj'].includes(f.id));
      localStorage.setItem('hr_custom_folders', JSON.stringify(customFolders));

      const customTemplates = updatedTemplates.filter(t =>
        !t.id.startsWith('tvm-') && !t.id.startsWith('asminds-') && !t.id.startsWith('jnj-')
      );
      localStorage.setItem('hr_custom_templates', JSON.stringify(customTemplates));
    }
  }

  public deleteCompany(id: string) {
    const updatedFolders = this.folders().filter(f => f.id !== id);
    this.folders.set(updatedFolders);

    const updatedTemplates = this.templates().filter(t => t.companyId !== id);
    this.templates.set(updatedTemplates);

    if (this.selectedFolderId() === id) {
      this.selectedFolderId.set(null);
      this.selectedTypeId.set(null);
      this.selectedTemplateId.set(null);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const customFolders = updatedFolders.filter(f => !['tvm', 'asminds', 'jnj'].includes(f.id));
      localStorage.setItem('hr_custom_folders', JSON.stringify(customFolders));

      const customTemplates = updatedTemplates.filter(t =>
        !t.id.startsWith('tvm-') && !t.id.startsWith('asminds-') && !t.id.startsWith('jnj-')
      );
      localStorage.setItem('hr_custom_templates', JSON.stringify(customTemplates));
    }
  }
}
