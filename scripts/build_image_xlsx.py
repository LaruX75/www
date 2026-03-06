import csv
import os
import sys

try:
    import xlsxwriter
except ImportError as exc:
    raise SystemExit(
        "Missing dependency: xlsxwriter. Install with: pip install XlsxWriter"
    ) from exc


def build_xlsx(project_root, csv_path, out_path):
    workbook = xlsxwriter.Workbook(out_path)
    ws = workbook.add_worksheet("images")

    header_fmt = workbook.add_format({"bold": True, "bg_color": "#e9ecef"})
    ws.write_row(0, 0, ["type", "path_or_url", "found_in", "preview"], header_fmt)

    ws.set_column(0, 0, 10)
    ws.set_column(1, 1, 70)
    ws.set_column(2, 2, 60)
    ws.set_column(3, 3, 25)

    row = 1
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for item in reader:
            img_type = item.get("type", "")
            path_or_url = item.get("path_or_url", "")
            found_in = item.get("found_in", "")

            ws.write(row, 0, img_type)
            ws.write(row, 1, path_or_url)
            ws.write(row, 2, found_in)

            if img_type == "file":
                abs_path = os.path.join(project_root, path_or_url)
                if os.path.isfile(abs_path):
                    # Keep previews reasonably sized inside the cell.
                    ws.set_row(row, 90)
                    ws.insert_image(row, 3, abs_path, {"x_scale": 0.2, "y_scale": 0.2, "object_position": 1})
                else:
                    ws.write(row, 3, "missing")
            else:
                ws.write(row, 3, "(url)")

            row += 1

    workbook.close()


if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    csv_path = os.path.join(project_root, "images-report.csv")
    out_path = os.path.join(project_root, "images-report.xlsx")

    if len(sys.argv) > 1:
        csv_path = os.path.abspath(sys.argv[1])
    if len(sys.argv) > 2:
        out_path = os.path.abspath(sys.argv[2])

    build_xlsx(project_root, csv_path, out_path)
    print(f"Wrote {out_path}")
