from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'Customer-Order-API-Guide.pdf'
pdfmetrics.registerFont(TTFont('Thai',r'C:\Windows\Fonts\leelawad.ttf'))
pdfmetrics.registerFont(TTFont('Thai-Bold',r'C:\Windows\Fonts\leelawdb.ttf'))
navy=colors.HexColor('#18283A'); teal=colors.HexColor('#0F766E'); pale=colors.HexColor('#E9F1F3'); line=colors.HexColor('#BAC8D2')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Cover',fontName='Thai-Bold',fontSize=24,leading=32,textColor=navy,alignment=1,spaceAfter=7*mm))
styles.add(ParagraphStyle(name='SectionTH',fontName='Thai-Bold',fontSize=16,leading=22,textColor=teal,spaceBefore=2*mm,spaceAfter=3*mm))
styles.add(ParagraphStyle(name='BodyTH',fontName='Thai',fontSize=10,leading=15,textColor=navy,spaceAfter=2*mm))
styles.add(ParagraphStyle(name='SmallTH',fontName='Thai',fontSize=8.5,leading=12,textColor=navy))
styles.add(ParagraphStyle(name='CellTH',fontName='Thai',fontSize=8,leading=10.5,textColor=navy))
styles.add(ParagraphStyle(name='CodeTH',fontName='Courier',fontSize=7.5,leading=10,textColor=navy,wordWrap='CJK'))
def p(text,style='BodyTH'): return Paragraph(text.replace('&','&amp;'),styles[style])
def grid(rows,widths):
    t=Table(rows,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.4,line),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('BACKGROUND',(0,0),(-1,0),pale)])); return t
class ChenER(Flowable):
    def __init__(self): super().__init__(); self.width=170*mm; self.height=94*mm
    def draw(self):
        c=self.canv; c.saveState(); c.scale(mm,mm); c.setStrokeColor(colors.HexColor('#4D5965')); c.setFillColor(colors.white); c.setLineWidth(.35)
        def ent(x,y,label):
            c.rect(x-10,y-4,20,8,stroke=1,fill=1); c.setFont('Helvetica',2.5); c.setFillColor(navy); c.drawCentredString(x,y-1.1,label); c.setFillColor(colors.white)
        def oval(x,y,label,key=False):
            c.setFillColor(colors.white); c.ellipse(x-10,y-4,x+10,y+4,stroke=1,fill=1); c.setFont('Helvetica',2.15); c.setFillColor(navy); c.drawCentredString(x,y-1,label)
            if key: c.line(x-6,y-1.8,x+6,y-1.8)
            c.setFillColor(colors.white)
        def link(x,y,a,b): c.line(x,y,a,b)
        ent(42,49,'Customer'); ent(128,49,'Order')
        c.saveState(); c.translate(85,49); c.rotate(45); c.rect(-7,-7,14,14,stroke=1,fill=1); c.restoreState()
        c.setFont('Helvetica',2.1); c.setFillColor(navy); c.drawCentredString(85,48.3,'Places Order'); c.setFillColor(colors.white)
        link(52,49,78,49); link(92,49,118,49); c.setFont('Helvetica',2.1); c.setFillColor(navy); c.drawString(58,51,'1'); c.drawString(110,51,'N')
        attrs=[(20,83,'customer_id',1,42,53),(47,88,'first_name',0,42,53),(73,80,'last_name',0,42,53),(15,66,'phone',0,34,51),(14,48,'address',0,32,49),(14,30,'email',0,32,45),(22,19,'latitude',0,38,45),(49,16,'longitude',0,42,45),(77,27,'created_at',0,51,45)]
        for x,y,name,key,a,b in attrs: link(x,y-4 if y>49 else y+4,a,b); oval(x,y,name,key)
        attrs=[(111,84,'order_id',1,128,53),(141,80,'order_date',0,128,53),(156,62,'box_quantity',0,138,52),(158,43,'status',0,138,49),(153,25,'simulated',0,137,45)]
        for x,y,name,key,a,b in attrs: link(x-10 if x>145 else x,y-4 if y>49 else y+4,a,b); oval(x,y,name,key)
        c.restoreState()
def footer(c,doc):
    c.saveState(); c.setStrokeColor(pale); c.line(18*mm,14*mm,192*mm,14*mm); c.setFont('Helvetica',8); c.setFillColor(colors.grey); c.drawString(18*mm,9*mm,'Customer & Order API | Course project'); c.drawRightString(192*mm,9*mm,str(doc.page)); c.restoreState()

story=[Spacer(1,10*mm),p('คู่มือ Web API<br/>จัดการลูกค้าและรายการสั่งซื้อ','Cover'),p('TypeScript · Express · MySQL','BodyTH'),Spacer(1,4*mm),p('ข้อมูลสมาชิกกลุ่ม','SectionTH')]
story += [grid([[p('ลำดับ','CellTH'),p('ชื่อ-นามสกุล','CellTH'),p('รหัสนักศึกษา','CellTH')]]+[[p(str(i),'CellTH'),p('________________________________','CellTH'),p('________________','CellTH')] for i in range(1,5)],[20*mm,85*mm,65*mm]),Spacer(1,4*mm),p('กลุ่ม / ตอนเรียน: __________________________________________','BodyTH'),p('URL API สาธารณะหลัง Deploy: ________________________________','BodyTH'),p('ก่อนส่ง Classroom ให้กรอกสมาชิกทุกคนและ URL จริงในช่องด้านบน','SmallTH'),PageBreak()]
story += [p('1. ER Diagram (Chen ตามตัวอย่างสไลด์)','SectionTH'),p('สี่เหลี่ยม = Entity, วงรี = Attribute, ข้าวหลามตัด = Relationship และขีดเส้นใต้ Primary Key ความสัมพันธ์ Customer 1:N Order: ลูกค้าหนึ่งคนมีออร์เดอร์ได้หลายรายการ และออร์เดอร์หนึ่งรายการเป็นของลูกค้าหนึ่งคน','BodyTH'),ChenER(),Spacer(1,2*mm),p('Customer: customer_id (PK), first_name, last_name, phone, address, email, latitude, longitude, created_at','SmallTH'),p('Order: order_id (PK), order_date, box_quantity, status, simulated; FK customer_id เกิดจาก relationship','SmallTH'),p('แผนภาพนี้เป็นแบบร่างรูปแบบ Chen ที่จัดตามสไลด์ โจทย์ระบุให้สร้างใน ERDPlus: วาดตามแอตทริบิวต์นี้ใน ERDPlus และนำภาพ Export จริงมาใส่ก่อนส่ง','BodyTH'),PageBreak()]
story += [p('2. API จัดการลูกค้า','SectionTH'),p('Base URL ในเครื่อง: http://localhost:3000 | request และ response เป็น JSON','BodyTH')]
customerRows=[['Method / Route','รายละเอียด'],['GET /api/customers','แสดงลูกค้าทุกคน'],['GET /api/customers/:id','แสดงลูกค้าตาม ID'],['POST /api/customers','เพิ่มลูกค้า: firstName, lastName, phone, address, email, latitude, longitude'],['PUT /api/customers/:id','แก้ไขข้อมูล โดยส่งฟิลด์ลูกค้าครบ'],['DELETE /api/customers/:id','ลบลูกค้า; 409 หากยังมีออร์เดอร์'],['GET /api/customers/search?firstName=an&lastName=suk','ค้นหาบางส่วนของชื่อ/นามสกุล; ส่งอย่างน้อยหนึ่งค่า'],['GET /api/customers/nearby?latitude=13.7563&longitude=100.5018','ค้นลูกค้าใน 1 กม.; เปลี่ยนระยะได้ด้วย radiusKm']]
story += [grid([[p(x,'CellTH') for x in row] for row in customerRows],[92*mm,78*mm]),Spacer(1,3*mm),p('ตัวอย่างเพิ่มลูกค้า','SectionTH'),p('{"firstName":"Nicha","lastName":"Sukjai","phone":"0812345678","address":"12 Sukhumvit Road, Bangkok","email":"nicha@example.com","latitude":13.7563,"longitude":100.5018}','CodeTH'),p('พิกัดเป็นองศาทศนิยม ระยะทางใช้ Haversine และผลค้นหาระยะใกล้เรียงจากใกล้ไปไกล','SmallTH'),PageBreak()]
story += [p('3. API จัดการรายการสั่งซื้อ','SectionTH')]
orderRows=[['Method / Route','รายละเอียด'],['GET /api/orders','แสดงออร์เดอร์ทั้งหมดพร้อมข้อมูลลูกค้า'],['GET /api/orders/:id','แสดงออร์เดอร์หนึ่งรายการ'],['POST /api/orders','เพิ่มออร์เดอร์: customerId, boxes'],['PUT /api/orders/:id','เปลี่ยนจำนวนกล่องด้วย {"boxes":5}'],['DELETE /api/orders/:id','ลบออร์เดอร์หนึ่งรายการ'],['POST /api/orders/simulate','สร้างออร์เดอร์จำลอง 25 รายการ'],['DELETE /api/orders/simulated','ลบออร์เดอร์จำลองทั้งหมด'],['GET /api/orders/nearby?latitude=13.7563&longitude=100.5018','แสดงออร์เดอร์ใน 2 กม. จากพิกัดลูกค้า; เปลี่ยนระยะได้ด้วย radiusKm']]
story += [grid([[p(x,'CellTH') for x in row] for row in orderRows],[92*mm,78*mm]),Spacer(1,3*mm),p('ตัวอย่างเพิ่มออร์เดอร์','SectionTH'),p('{"customerId":1,"boxes":3}','CodeTH'),p('รายการจำลองมีข้อมูลลูกค้าที่สั่ง จำนวนกล่อง วันที่สั่ง และตัวบ่งชี้ simulated. การล้างรายการจำลองไม่ลบออร์เดอร์ที่ผู้ใช้เพิ่มเอง','BodyTH'),p('รหัสตอบกลับหลัก: 201 สร้างสำเร็จ, 400 ข้อมูลไม่ถูกต้อง, 404 ไม่พบ, 409 ลบไม่ได้เพราะมีความสัมพันธ์, 503 ฐานข้อมูลไม่พร้อม','SmallTH'),PageBreak()]
story += [p('4. ติดตั้งและเริ่มใช้งาน','SectionTH'),p('ต้องติดตั้ง Node.js และ MySQL Server ก่อน จาก PowerShell ในโฟลเดอร์โปรเจ็กต์ที่มี package.json:','BodyTH'),p('npm install<br/>Copy-Item .env.example .env<br/># แก้ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD ใน .env<br/># Import database.sql ใน MySQL Workbench หรือ phpMyAdmin<br/>npm run seed<br/>npm run dev','CodeTH'),p('จากนั้นเปิด http://localhost:3000/api. ตรวจฐานข้อมูลที่ http://localhost:3000/health ซึ่งควรแสดง database connected. Seed จะสร้างตัวอย่าง 30 ลูกค้าและ 25 ออร์เดอร์ เฉพาะเมื่อฐานข้อมูลยังไม่มีลูกค้า','BodyTH'),p('5. Deploy และเตรียมส่ง','SectionTH'),p('Render Build Command: npm install && npm run build | Start Command: npm start. ตั้ง Environment Variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME. ทดสอบ /health และ /api/customers บน URL ที่ Render ให้มา','BodyTH'),p('สถานะ: ยังไม่มีบัญชี MySQL/Render ของกลุ่ม จึงยังไม่ได้ Deploy และไม่มี URL สาธารณะ. ต้องสร้าง ER Diagram ใน ERDPlus และเพิ่มภาพ Export, ชื่อสมาชิก และ URL จริงก่อนส่ง PDF ฉบับสุดท้าย','BodyTH'),p('ดูรายละเอียด schema และการ Deploy เพิ่มเติมใน database.sql, docs/erd.md และ docs/deployment.md','SmallTH')]
SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=16*mm,bottomMargin=20*mm,title='คู่มือ Web API ลูกค้าและออร์เดอร์',author='Course project').build(story,onFirstPage=footer,onLaterPages=footer)
print(str(OUT))
