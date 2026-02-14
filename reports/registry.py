from typing import Dict, List, Type
from .strategies.base import ReportStrategy

class ReportRegistry:
    _registry: Dict[str, Type[ReportStrategy]] = {}

    @classmethod
    def register(cls, strategy_class: Type[ReportStrategy]):
        """Registers a report strategy class."""
        instance = strategy_class()
        cls._registry[instance.get_name()] = strategy_class

    @classmethod
    def get_strategy(cls, name: str) -> ReportStrategy:
        """Returns an instance of the requested strategy."""
        strategy_class = cls._registry.get(name)
        if not strategy_class:
            raise ValueError(f"Report strategy '{name}' not found.")
        return strategy_class()

    @classmethod
    def get_all_reports(cls) -> List[Dict[str, str]]:
        """Returns a list of available reports for the frontend."""
        reports = []
        for name, strategy_class in cls._registry.items():
            instance = strategy_class()
            reports.append({
                "id": instance.get_name(),
                "name": instance.get_display_name(),
                "category": instance.get_category(),
                "parameters": instance.get_parameters()
            })
        return reports
