from datetime import datetime
import uuid
import os


def make_unique_name(file_path):
    base_name = os.path.basename(file_path)
    formatted_time = datetime.now().strftime('%Y%m%d%H%M%S')
    unique_identifier = str(uuid.uuid4().hex)
    file_name, file_extension = os.path.splitext(base_name)
    unique_filename = f"{file_name}_{formatted_time}_{unique_identifier}{file_extension}"

    return unique_filename