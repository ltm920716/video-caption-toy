from loguru import logger

try:
    import torch
    assert torch.cuda.is_available()
    from .video_auto_wipe.demo_fix import AutoWipe
    auto_wipe = AutoWipe()
except:
    logger.error("Fail to import torch or cuda is not available")
    auto_wipe = None

# from .video_auto_wipe.demo_fix import AutoWipe
# auto_wipe = AutoWipe(device='cpu')

    

